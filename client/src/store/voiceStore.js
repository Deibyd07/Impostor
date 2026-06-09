import { create } from 'zustand'

const VOICE_VOLUME_KEY = 'el-impostor-voice-volume'
const VOICE_PEER_VOLUME_KEY = 'el-impostor-voice-peer-volumes'
const VOICE_INPUT_DEVICE_KEY = 'el-impostor-voice-input-device'
const VOICE_OUTPUT_DEVICE_KEY = 'el-impostor-voice-output-device'
export const LOCAL_SPEAKER_ID = '__local__'
export const VOICE_REMOTE_GAIN_BOOST = 1.9
const VOICE_JOIN_RETRY_DELAY_MS = 450
const PEER_RECONNECT_DELAY_MS = 900
const SPEECH_THRESHOLD = 0.035
const SPEECH_HOLD_MS = 360
const SPEECH_POLL_MS = 90
const RELAY_SAMPLE_RATE = 16000
const RELAY_BUFFER_SIZE = 2048
const RELAY_CHUNK_SAMPLES = 2048
const RELAY_SEND_INTERVAL_MS = 120
const RELAY_START_DELAY_SECONDS = 0.08
const RELAY_MAX_BUFFER_SECONDS = 0.65
const TURN_URLS = (import.meta.env.VITE_TURN_URLS || import.meta.env.VITE_TURN_URL || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean)
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''
const TURN_SERVER = TURN_URLS.length
  ? {
      urls: TURN_URLS,
      ...(TURN_USERNAME ? { username: TURN_USERNAME } : {}),
      ...(TURN_CREDENTIAL ? { credential: TURN_CREDENTIAL } : {}),
    }
  : null
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(TURN_SERVER ? [TURN_SERVER] : []),
]

let socketRef = null
let localStream = null
let roomCodeRef = null
let joinedRoomCode = null
let myIdRef = null
let playersRef = []
let peers = new Map()
let remoteStreams = new Map()
let pendingCandidates = new Map()
let micWantedRef = true
let canSpeakRef = true
let allowedPeerIdsRef = null
let peerVolumePrefs = loadPeerVolumePrefs()
let selectedInputDeviceIdRef = loadDeviceId(VOICE_INPUT_DEVICE_KEY)
let selectedOutputDeviceIdRef = loadDeviceId(VOICE_OUTPUT_DEVICE_KEY)
let audioContext = null
let speechMeters = new Map()
let speechLoopId = null
let lastSpeechPublishAt = 0
let lastSpeakingKey = ''
let socketHandlers = null
let voiceJoinRetryTimer = null
let peerReconnectTimers = new Map()
let micTestRunId = 0
let outputTestRunId = 0
let relayCapture = null
let relayOutput = null
let relayPlayers = new Map()
let relaySpeakingUntil = new Map()
let relaySpeakingCleanupTimer = null

function loadVolume() {
  try {
    const raw = localStorage.getItem(VOICE_VOLUME_KEY)
    if (raw == null) return 1
    const value = Number(raw)
    if (value === 0.9) {
      localStorage.setItem(VOICE_VOLUME_KEY, '1')
      return 1
    }
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1
  } catch {
    return 1
  }
}

function saveVolume(value) {
  try {
    localStorage.setItem(VOICE_VOLUME_KEY, String(value))
  } catch {}
}

function loadPeerVolumePrefs() {
  try {
    const raw = localStorage.getItem(VOICE_PEER_VOLUME_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function savePeerVolumePrefs() {
  try {
    localStorage.setItem(VOICE_PEER_VOLUME_KEY, JSON.stringify(peerVolumePrefs))
  } catch {}
}

function loadDeviceId(key) {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function saveDeviceId(key, value) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {}
}

function supportsVoice() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof RTCPeerConnection !== 'undefined'
}

function supportsDeviceSelection() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.enumerateDevices
}

function supportsOutputSelection() {
  return typeof HTMLMediaElement !== 'undefined' && typeof HTMLMediaElement.prototype.setSinkId === 'function'
}

function audioConstraints(deviceId = selectedInputDeviceIdRef) {
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
  }
}

async function requestMicrophoneStream(deviceId = selectedInputDeviceIdRef) {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints(deviceId),
      video: false,
    })
  } catch (error) {
    if (!deviceId) throw error
    selectedInputDeviceIdRef = ''
    saveDeviceId(VOICE_INPUT_DEVICE_KEY, '')
    return navigator.mediaDevices.getUserMedia({
      audio: audioConstraints(''),
      video: false,
    })
  }
}

async function applyOutputDevice(audio, deviceId = selectedOutputDeviceIdRef) {
  if (!audio || typeof audio.setSinkId !== 'function') return
  try {
    await audio.setSinkId(deviceId || '')
  } catch {}
}

function downsampleAudio(input, inputSampleRate, outputSampleRate) {
  if (!input?.length || inputSampleRate === outputSampleRate) return new Float32Array(input || [])
  const ratio = inputSampleRate / outputSampleRate
  const outputLength = Math.max(1, Math.floor(input.length / ratio))
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio)
    const end = Math.min(input.length, Math.floor((i + 1) * ratio))
    let sum = 0
    let count = 0
    for (let j = start; j < end; j += 1) {
      sum += input[j]
      count += 1
    }
    output[i] = count ? sum / count : input[start] || 0
  }

  return output
}

function encodePcm16(chunks, totalSamples) {
  const pcm = new Int16Array(totalSamples)
  let offset = 0
  chunks.forEach(chunk => {
    for (let i = 0; i < chunk.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[i]))
      pcm[offset] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      offset += 1
    }
  })
  return pcm
}

function normalizeRelayBuffer(audio) {
  if (!audio) return null
  if (audio instanceof ArrayBuffer) return audio
  if (ArrayBuffer.isView(audio)) {
    return audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength)
  }
  return null
}

function relayPcmLevel(samples) {
  if (!samples?.length) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i += 1) {
    const value = samples[i] / (samples[i] < 0 ? 0x8000 : 0x7fff)
    sum += value * value
  }
  return Math.sqrt(sum / samples.length)
}

function deviceOption(device, fallbackLabel) {
  return {
    deviceId: device.deviceId,
    label: device.label || fallbackLabel,
  }
}

function peerProfile(peerId) {
  const player = playersRef.find(item => item.id === peerId)
  return {
    id: peerId,
    name: player?.name || 'Jugador',
    avatar: player?.avatar || player?.name?.trim()?.charAt(0)?.toUpperCase() || '?',
  }
}

function peerVolumeKey(peerId) {
  const profile = peerProfile(peerId)
  const nameKey = profile.name?.trim()?.toLowerCase()
  return nameKey || peerId
}

function preferredPeerVolume(peerId) {
  const saved = Number(peerVolumePrefs[peerVolumeKey(peerId)])
  return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 1
}

function normalizeAllowedPeerIds(peerIds) {
  if (peerIds == null) return null
  const ids = Array.isArray(peerIds) ? peerIds : [...peerIds]
  return new Set(ids.filter(peerId => peerId && peerId !== myIdRef))
}

function sameAllowedPeerIds(a, b) {
  if (a === null || b === null) return a === b
  if (a.size !== b.size) return false
  for (const peerId of a) {
    if (!b.has(peerId)) return false
  }
  return true
}

function isPeerAllowed(peerId) {
  return allowedPeerIdsRef === null || allowedPeerIdsRef.has(peerId)
}

function buildPeerPatch(peerId, patch = {}) {
  return {
    ...peerProfile(peerId),
    status: 'connecting',
    ...patch,
  }
}

export const useVoiceStore = create((set, get) => {
  const clearVoiceJoinRetry = () => {
    if (!voiceJoinRetryTimer) return
    clearTimeout(voiceJoinRetryTimer)
    voiceJoinRetryTimer = null
  }

  const scheduleVoiceJoinRetry = () => {
    clearVoiceJoinRetry()
    if (typeof window === 'undefined') return
    voiceJoinRetryTimer = window.setTimeout(() => {
      voiceJoinRetryTimer = null
      joinIfReady({ force: true })
    }, VOICE_JOIN_RETRY_DELAY_MS)
  }

  const clearPeerReconnectTimer = (peerId) => {
    const timer = peerReconnectTimers.get(peerId)
    if (!timer) return
    clearTimeout(timer)
    peerReconnectTimers.delete(peerId)
  }

  const clearPeerReconnectTimers = () => {
    peerReconnectTimers.forEach(timer => clearTimeout(timer))
    peerReconnectTimers = new Map()
  }

  const schedulePeerReconnect = (peerId) => {
    if (!peerId || !get().enabled || !localStream || !isPeerAllowed(peerId)) return
    clearPeerReconnectTimer(peerId)
    const timer = setTimeout(() => {
      peerReconnectTimers.delete(peerId)
      if (!get().enabled || !localStream || !isPeerAllowed(peerId)) return
      removePeer(peerId)
      registerAvailablePeer(peerId)
      joinIfReady({ force: true })
    }, PEER_RECONNECT_DELAY_MS)
    peerReconnectTimers.set(peerId, timer)
  }

  const publishSpeaking = (force = false) => {
    const now = Date.now()
    relaySpeakingUntil.forEach((until, peerId) => {
      if (until <= now) relaySpeakingUntil.delete(peerId)
    })

    const meteredPeerIds = [...speechMeters.entries()]
      .filter(([peerId, meter]) => {
        if (peerId === LOCAL_SPEAKER_ID && !get().micOpen) return false
        return now - meter.lastSpokeAt < SPEECH_HOLD_MS
      })
      .map(([peerId]) => peerId)
    const relayedPeerIds = [...relaySpeakingUntil.keys()]
    const speakingPeerIds = [...new Set([...meteredPeerIds, ...relayedPeerIds])]
      .sort()
    const key = speakingPeerIds.join('|')
    if (!force && key === lastSpeakingKey) return
    lastSpeakingKey = key
    set({ speakingPeerIds })
  }

  const scheduleRelaySpeakingCleanup = () => {
    if (relaySpeakingCleanupTimer) clearTimeout(relaySpeakingCleanupTimer)
    relaySpeakingCleanupTimer = setTimeout(() => {
      relaySpeakingCleanupTimer = null
      publishSpeaking(true)
    }, SPEECH_HOLD_MS + 40)
  }

  const markRelaySpeaking = (peerId, level) => {
    if (!peerId || level < SPEECH_THRESHOLD * 0.65) return
    relaySpeakingUntil.set(peerId, Date.now() + SPEECH_HOLD_MS)
    publishSpeaking(true)
    scheduleRelaySpeakingCleanup()
  }

  const stopSpeechLoopIfIdle = () => {
    if (speechMeters.size || !speechLoopId) return
    cancelAnimationFrame(speechLoopId)
    speechLoopId = null
    lastSpeechPublishAt = 0
    publishSpeaking(true)
  }

  const startSpeechLoop = () => {
    if (speechLoopId || typeof requestAnimationFrame === 'undefined') return

    const tick = () => {
      const now = Date.now()
      speechMeters.forEach((meter, peerId) => {
        try {
          meter.analyser.getByteTimeDomainData(meter.data)
          let sum = 0
          for (let i = 0; i < meter.data.length; i += 1) {
            const value = (meter.data[i] - 128) / 128
            sum += value * value
          }
          const level = Math.sqrt(sum / meter.data.length)
          const shouldListen = peerId !== LOCAL_SPEAKER_ID || get().micOpen
          if (shouldListen && level >= SPEECH_THRESHOLD) meter.lastSpokeAt = now
        } catch {}
      })

      if (now - lastSpeechPublishAt >= SPEECH_POLL_MS) {
        lastSpeechPublishAt = now
        publishSpeaking()
      }

      if (speechMeters.size) {
        speechLoopId = requestAnimationFrame(tick)
      } else {
        speechLoopId = null
        publishSpeaking(true)
      }
    }

    speechLoopId = requestAnimationFrame(tick)
  }

  const ensureAudioContext = async () => {
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    audioContext = audioContext || new AudioContextClass()
    if (audioContext.state === 'suspended') {
      try { await audioContext.resume() } catch {}
    }
    return audioContext
  }

  const ensureRelayOutput = async () => {
    const context = await ensureAudioContext()
    if (!context?.createMediaStreamDestination) return null

    if (relayOutput?.context === context && relayOutput.audio) {
      await applyOutputDevice(relayOutput.audio)
      relayOutput.audio.play?.().catch(() => {})
      return relayOutput
    }

    const destination = context.createMediaStreamDestination()
    const audio = new Audio()
    audio.autoplay = true
    audio.srcObject = destination.stream
    audio.volume = 1
    await applyOutputDevice(audio)
    audio.play?.().catch(() => {})
    relayOutput = { context, destination, audio }
    return relayOutput
  }

  const stopRelayOutput = () => {
    if (relayOutput?.audio) {
      try { relayOutput.audio.pause() } catch {}
      relayOutput.audio.srcObject = null
    }
    relayOutput = null
    relayPlayers = new Map()
    relaySpeakingUntil = new Map()
    if (relaySpeakingCleanupTimer) {
      clearTimeout(relaySpeakingCleanupTimer)
      relaySpeakingCleanupTimer = null
    }
    publishSpeaking(true)
  }

  const sendRelayChunk = (capture) => {
    if (!capture?.pendingSamples || !socketRef?.connected || !joinedRoomCode) return
    const pcm = encodePcm16(capture.pending, capture.pendingSamples)
    capture.pending = []
    capture.pendingSamples = 0
    capture.lastSentAt = performance.now()
    socketRef.emit('voice:audio', {
      audio: pcm.buffer,
      sampleRate: RELAY_SAMPLE_RATE,
      sequence: capture.sequence,
    })
    capture.sequence += 1
  }

  const stopRelayCapture = () => {
    if (!relayCapture) return
    try { relayCapture.processor.onaudioprocess = null } catch {}
    try { relayCapture.source.disconnect() } catch {}
    try { relayCapture.processor.disconnect() } catch {}
    try { relayCapture.silentGain.disconnect() } catch {}
    relayCapture = null
    set({ relayActive: false })
  }

  const startRelayCapture = async () => {
    if (!localStream || relayCapture) return
    const context = await ensureAudioContext()
    if (!context?.createScriptProcessor) return
    await ensureRelayOutput()

    const source = context.createMediaStreamSource(localStream)
    const processor = context.createScriptProcessor(RELAY_BUFFER_SIZE, 1, 1)
    const silentGain = context.createGain()
    silentGain.gain.value = 0
    const capture = {
      context,
      source,
      processor,
      silentGain,
      pending: [],
      pendingSamples: 0,
      lastSentAt: 0,
      sequence: 0,
    }

    processor.onaudioprocess = (event) => {
      const track = localStream?.getAudioTracks?.()[0]
      if (
        !get().enabled ||
        !socketRef?.connected ||
        !joinedRoomCode ||
        !micWantedRef ||
        !canSpeakRef ||
        !track?.enabled ||
        track.readyState !== 'live'
      ) {
        capture.pending = []
        capture.pendingSamples = 0
        return
      }

      const input = event.inputBuffer.getChannelData(0)
      const downsampled = downsampleAudio(input, capture.context.sampleRate, RELAY_SAMPLE_RATE)
      capture.pending.push(downsampled)
      capture.pendingSamples += downsampled.length

      const now = performance.now()
      if (
        capture.pendingSamples >= RELAY_CHUNK_SAMPLES ||
        now - capture.lastSentAt >= RELAY_SEND_INTERVAL_MS
      ) {
        sendRelayChunk(capture)
      }
    }

    source.connect(processor)
    processor.connect(silentGain)
    silentGain.connect(context.destination)
    relayCapture = capture
    set({ relayActive: true })
  }

  const playRelayAudio = async ({ fromId, audio, sampleRate = RELAY_SAMPLE_RATE } = {}) => {
    if (!fromId || fromId === myIdRef || !get().enabled || !isPeerAllowed(fromId)) return
    const buffer = normalizeRelayBuffer(audio)
    if (!buffer || buffer.byteLength < 2) return

    const output = await ensureRelayOutput()
    const context = output?.context
    if (!context) return

    const pcm = new Int16Array(buffer)
    if (!pcm.length) return
    const safeSampleRate = Math.max(8000, Math.min(48000, Number(sampleRate) || RELAY_SAMPLE_RATE))
    const audioBuffer = context.createBuffer(1, pcm.length, safeSampleRate)
    const channel = audioBuffer.getChannelData(0)
    for (let i = 0; i < pcm.length; i += 1) {
      channel[i] = pcm[i] / (pcm[i] < 0 ? 0x8000 : 0x7fff)
    }

    markRelaySpeaking(fromId, relayPcmLevel(pcm))

    const state = get()
    const volume = Math.max(0, Number(state.outputVolume) || 0)
      * Math.max(0, Number(state.peerVolumes[fromId] ?? preferredPeerVolume(fromId)) || 0)
      * VOICE_REMOTE_GAIN_BOOST
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = audioBuffer
    gain.gain.value = Math.min(3, volume)
    source.connect(gain)
    gain.connect(output.destination)

    const player = relayPlayers.get(fromId) || { nextTime: 0 }
    const now = context.currentTime
    if (!player.nextTime || player.nextTime < now + 0.02 || player.nextTime - now > RELAY_MAX_BUFFER_SECONDS) {
      player.nextTime = now + RELAY_START_DELAY_SECONDS
    }
    source.start(player.nextTime)
    player.nextTime += audioBuffer.duration
    relayPlayers.set(fromId, player)
    source.onended = () => {
      try { source.disconnect() } catch {}
      try { gain.disconnect() } catch {}
    }
    setPeer(fromId, { status: 'connected' })
  }

  const stopSpeechMeter = (peerId) => {
    const meter = speechMeters.get(peerId)
    if (!meter) return
    try { meter.source.disconnect() } catch {}
    speechMeters.delete(peerId)
    stopSpeechLoopIfIdle()
  }

  const startSpeechMeter = async (peerId, stream) => {
    if (!peerId || !stream?.getAudioTracks?.().length) return
    const context = await ensureAudioContext()
    if (!context) return
    stopSpeechMeter(peerId)
    try {
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.72
      source.connect(analyser)
      speechMeters.set(peerId, {
        source,
        analyser,
        data: new Uint8Array(analyser.fftSize),
        lastSpokeAt: 0,
      })
      startSpeechLoop()
    } catch {}
  }

  const refreshDevices = async () => {
    if (!supportsDeviceSelection()) {
      set({
        inputDevices: [],
        outputDevices: [],
        canSelectOutput: false,
        devicesStatus: 'unsupported',
      })
      return
    }

    set({ devicesStatus: 'loading' })
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const inputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map((device, index) => deviceOption(device, `Microfono ${index + 1}`))
      const outputDevices = devices
        .filter(device => device.kind === 'audiooutput')
        .map((device, index) => deviceOption(device, `Salida ${index + 1}`))

      if (selectedInputDeviceIdRef && inputDevices.length && !inputDevices.some(device => device.deviceId === selectedInputDeviceIdRef)) {
        selectedInputDeviceIdRef = ''
        saveDeviceId(VOICE_INPUT_DEVICE_KEY, '')
      }
      if (selectedOutputDeviceIdRef && outputDevices.length && !outputDevices.some(device => device.deviceId === selectedOutputDeviceIdRef)) {
        selectedOutputDeviceIdRef = ''
        saveDeviceId(VOICE_OUTPUT_DEVICE_KEY, '')
      }

      set({
        inputDevices,
        outputDevices,
        selectedInputDeviceId: selectedInputDeviceIdRef,
        selectedOutputDeviceId: selectedOutputDeviceIdRef,
        canSelectOutput: supportsOutputSelection(),
        devicesStatus: 'ready',
      })
    } catch {
      set({ devicesStatus: 'error' })
    }
  }

  const stopRemoteSpeechMeters = () => {
    ;[...speechMeters.keys()].forEach(peerId => {
      if (peerId !== LOCAL_SPEAKER_ID) stopSpeechMeter(peerId)
    })
  }

  const publishRemoteStreams = () => {
    set({
      remoteStreams: [...remoteStreams.entries()].map(([peerId, stream]) => ({
        peerId,
        stream,
        key: `${peerId}-${stream.id}`,
      })),
    })
  }

  const setPeer = (peerId, patch) => {
    set((state) => ({
      peers: {
        ...state.peers,
        [peerId]: {
          ...(state.peers[peerId] || buildPeerPatch(peerId)),
          ...buildPeerPatch(peerId, patch),
        },
      },
      peerVolumes: {
        ...state.peerVolumes,
        [peerId]: state.peerVolumes[peerId] ?? preferredPeerVolume(peerId),
      },
    }))
  }

  const removePeer = (peerId) => {
    clearPeerReconnectTimer(peerId)
    const peer = peers.get(peerId)
    if (peer) {
      try { peer.pc.close() } catch {}
      peers.delete(peerId)
    }
    pendingCandidates.delete(peerId)
    remoteStreams.delete(peerId)
    relayPlayers.delete(peerId)
    relaySpeakingUntil.delete(peerId)
    stopSpeechMeter(peerId)
    publishRemoteStreams()
    publishSpeaking(true)
    set((state) => {
      const next = { ...state.peers }
      const nextVolumes = { ...state.peerVolumes }
      delete next[peerId]
      delete nextVolumes[peerId]
      return { peers: next, peerVolumes: nextVolumes }
    })
  }

  const closeAllPeers = () => {
    clearPeerReconnectTimers()
    peers.forEach(({ pc }) => {
      try { pc.close() } catch {}
    })
    peers = new Map()
    pendingCandidates = new Map()
    remoteStreams = new Map()
    relayPlayers = new Map()
    relaySpeakingUntil = new Map()
    stopRemoteSpeechMeters()
    publishRemoteStreams()
    publishSpeaking(true)
    set({ peers: {}, peerVolumes: {} })
  }

  const emitSignal = (targetId, signal) => {
    socketRef?.emit('voice:signal', { targetId, signal })
  }

  const applyMicState = () => {
    const micOpen = !!localStream && get().enabled && micWantedRef && canSpeakRef
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = micOpen
    })
    set({ micOpen })
  }

  const addLocalTracks = (pc) => {
    if (!localStream) return
    localStream.getTracks().forEach(track => {
      if (!pc.getSenders().some(sender => sender.track === track)) {
        pc.addTrack(track, localStream)
      }
    })
  }

  const replaceLocalStream = async (nextStream) => {
    const [nextAudioTrack] = nextStream.getAudioTracks()
    if (!nextAudioTrack) throw new Error('missing-audio-track')

    stopRelayCapture()
    const previousStream = localStream
    localStream = nextStream
    const replacements = []
    peers.forEach(({ pc }) => {
      const sender = pc.getSenders().find(item => item.track?.kind === 'audio')
      if (sender) replacements.push(sender.replaceTrack(nextAudioTrack).catch(() => {}))
      else addLocalTracks(pc)
    })
    await Promise.all(replacements)
    previousStream?.getTracks().forEach(track => track.stop())
    await startSpeechMeter(LOCAL_SPEAKER_ID, localStream)
    await startRelayCapture()
    applyMicState()
  }

  const flushPendingCandidates = async (peerId, pc) => {
    const queued = pendingCandidates.get(peerId) || []
    pendingCandidates.delete(peerId)
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate)
      } catch {}
    }
  }

  const createPeer = (peerId) => {
    const existing = peers.get(peerId)
    if (existing) return existing.pc

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peers.set(peerId, { pc })
    setPeer(peerId, { status: 'connecting' })
    addLocalTracks(pc)

    pc.onicecandidate = (event) => {
      if (!event.candidate) return
      emitSignal(peerId, { type: 'ice-candidate', candidate: event.candidate })
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (!stream) return
      remoteStreams.set(peerId, stream)
      publishRemoteStreams()
      startSpeechMeter(peerId, stream)
      setPeer(peerId, { status: 'connected' })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setPeer(peerId, { status: pc.connectionState })
        schedulePeerReconnect(peerId)
        return
      }
      if (pc.connectionState === 'closed') {
        setPeer(peerId, { status: pc.connectionState })
        return
      }
      if (pc.connectionState === 'connected') {
        clearPeerReconnectTimer(peerId)
        setPeer(peerId, { status: 'connected' })
      }
    }

    return pc
  }

  const makeOffer = async (peerId) => {
    if (!get().enabled || !localStream || !isPeerAllowed(peerId)) return
    const pc = createPeer(peerId)
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true })
      await pc.setLocalDescription(offer)
      emitSignal(peerId, { type: 'offer', sdp: offer.sdp })
    } catch (error) {
      set({ error: `No se pudo iniciar voz con ${peerProfile(peerId).name}` })
      removePeer(peerId)
    }
  }

  const handleSignal = async ({ fromId, signal } = {}) => {
    if (!fromId || !signal || !get().enabled || !localStream || !isPeerAllowed(fromId)) return
    const pc = createPeer(fromId)
    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp })
        await flushPendingCandidates(fromId, pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        emitSignal(fromId, { type: 'answer', sdp: answer.sdp })
        return
      }

      if (signal.type === 'answer') {
        await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
        await flushPendingCandidates(fromId, pc)
        return
      }

      if (signal.type === 'ice-candidate' && signal.candidate) {
        if (!pc.remoteDescription) {
          const queued = pendingCandidates.get(fromId) || []
          queued.push(signal.candidate)
          pendingCandidates.set(fromId, queued)
          return
        }
        await pc.addIceCandidate(signal.candidate)
      }
    } catch (error) {
      set({ error: `Se perdio la conexion de voz con ${peerProfile(fromId).name}` })
      removePeer(fromId)
    }
  }

  const leaveJoinedRoom = () => {
    clearVoiceJoinRetry()
    if (socketRef && (joinedRoomCode || roomCodeRef)) {
      socketRef.emit('voice:leave')
    }
    joinedRoomCode = null
    closeAllPeers()
  }

  const joinIfReady = ({ force = false } = {}) => {
    if (!get().enabled || !socketRef || !roomCodeRef || !localStream) return
    if (joinedRoomCode && joinedRoomCode !== roomCodeRef) leaveJoinedRoom()
    if (!socketRef.connected) {
      set({ status: 'connecting' })
      return
    }
    if (!force && joinedRoomCode === roomCodeRef) return
    joinedRoomCode = roomCodeRef
    set({ status: 'connecting', error: null })
    socketRef.emit('voice:join')
  }

  const shouldInitiateConnection = (peerId) => {
    if (!myIdRef || !peerId) return false
    return String(myIdRef) < String(peerId)
  }

  const registerAvailablePeer = (peerId) => {
    if (!peerId || peerId === myIdRef || !isPeerAllowed(peerId)) return
    setPeer(peerId, { status: 'waiting' })
    if (shouldInitiateConnection(peerId)) makeOffer(peerId)
  }

  const bindSocket = (socket) => {
    if (socketRef === socket) return
    if (socketRef) {
      if (socketHandlers) {
        socketRef.off('connect', socketHandlers.connect)
        socketRef.off('disconnect', socketHandlers.disconnect)
        socketRef.off('voice:peers', socketHandlers.voicePeers)
        socketRef.off('voice:peerJoined', socketHandlers.voicePeerJoined)
        socketRef.off('voice:peerLeft', socketHandlers.voicePeerLeft)
        socketRef.off('voice:signal', socketHandlers.voiceSignal)
        socketRef.off('voice:audio', socketHandlers.voiceAudio)
      }
      closeAllPeers()
      joinedRoomCode = null
      socketHandlers = null
    }
    socketRef = socket || null
    if (!socketRef) {
      leaveJoinedRoom()
      return
    }

    socketHandlers = {
      connect: () => {
        joinedRoomCode = null
        closeAllPeers()
        if (get().enabled) {
          set({ status: 'connecting' })
          scheduleVoiceJoinRetry()
        }
      },
      disconnect: () => {
        clearVoiceJoinRetry()
        joinedRoomCode = null
        closeAllPeers()
        set({ status: get().enabled ? 'connecting' : 'idle' })
      },
      voicePeers: ({ peers: peerIds = [] } = {}) => {
        clearVoiceJoinRetry()
        joinedRoomCode = roomCodeRef
        const allowedPeers = peerIds.filter(peerId => peerId !== myIdRef && isPeerAllowed(peerId))
        set({ status: allowedPeers.length ? 'connecting' : 'connected' })
        allowedPeers.forEach(registerAvailablePeer)
      },
      voicePeerJoined: ({ peerId } = {}) => {
        registerAvailablePeer(peerId)
      },
      voicePeerLeft: ({ peerId } = {}) => {
        if (peerId) removePeer(peerId)
      },
      voiceSignal: handleSignal,
      voiceAudio: playRelayAudio,
    }

    socketRef.on('connect', socketHandlers.connect)
    socketRef.on('disconnect', socketHandlers.disconnect)
    socketRef.on('voice:peers', socketHandlers.voicePeers)
    socketRef.on('voice:peerJoined', socketHandlers.voicePeerJoined)
    socketRef.on('voice:peerLeft', socketHandlers.voicePeerLeft)
    socketRef.on('voice:signal', socketHandlers.voiceSignal)
    socketRef.on('voice:audio', socketHandlers.voiceAudio)
    if (socketRef.connected) {
      joinIfReady({ force: true })
    } else if (get().enabled) {
      set({ status: 'connecting' })
    }
  }

  return {
    supported: supportsVoice(),
    enabled: false,
    micWanted: true,
    micOpen: false,
    canSpeak: true,
    suppressReason: null,
    permission: 'idle',
    status: 'idle',
    error: null,
    peers: {},
    remoteStreams: [],
    outputVolume: loadVolume(),
    peerVolumes: {},
    speakingPeerIds: [],
    inputDevices: [],
    outputDevices: [],
    selectedInputDeviceId: selectedInputDeviceIdRef,
    selectedOutputDeviceId: selectedOutputDeviceIdRef,
    canSelectOutput: supportsOutputSelection(),
    devicesStatus: 'idle',
    micTestActive: false,
    micTestLevel: 0,
    micTestStatus: null,
    outputTestActive: false,
    outputTestStatus: null,
    relayActive: false,

    bindSocket,
    refreshDevices,

    watchDevices: () => {
      refreshDevices()
      const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : null
      if (!mediaDevices?.addEventListener) return () => {}
      mediaDevices.addEventListener('devicechange', refreshDevices)
      return () => mediaDevices.removeEventListener('devicechange', refreshDevices)
    },

    setRoomContext: ({ roomCode, myId, players }) => {
      roomCodeRef = roomCode || null
      myIdRef = myId || null
      playersRef = Array.isArray(players) ? players : []
      set((state) => {
        const nextPeers = {}
        const nextVolumes = { ...state.peerVolumes }
        Object.keys(state.peers).forEach(peerId => {
          nextPeers[peerId] = {
            ...state.peers[peerId],
            ...peerProfile(peerId),
          }
          nextVolumes[peerId] = nextVolumes[peerId] ?? preferredPeerVolume(peerId)
        })
        return { peers: nextPeers, peerVolumes: nextVolumes }
      })
      if (!roomCodeRef) leaveJoinedRoom()
      else joinIfReady({ force: true })
    },

    setAllowedPeerIds: (peerIds) => {
      const nextAllowedPeerIds = normalizeAllowedPeerIds(peerIds)
      if (sameAllowedPeerIds(allowedPeerIdsRef, nextAllowedPeerIds)) return

      allowedPeerIdsRef = nextAllowedPeerIds
      ;[...peers.keys()].forEach(peerId => {
        if (!isPeerAllowed(peerId)) removePeer(peerId)
      })

      if (get().enabled && socketRef && localStream) joinIfReady({ force: true })
    },

    setCanSpeak: (canSpeak, reason = null) => {
      canSpeakRef = !!canSpeak
      set({ canSpeak: canSpeakRef, suppressReason: canSpeakRef ? null : reason })
      applyMicState()
    },

    start: async () => {
      if (get().enabled) return
      if (!supportsVoice()) {
        set({ permission: 'unsupported', error: 'Este navegador no soporta chat de voz.' })
        return
      }

      set({ permission: 'prompting', error: null })
      try {
        localStream = await requestMicrophoneStream()
        micWantedRef = true
        set({ enabled: true, micWanted: true, permission: 'granted', status: 'ready' })
        await startSpeechMeter(LOCAL_SPEAKER_ID, localStream)
        await startRelayCapture()
        refreshDevices()
        applyMicState()
        joinIfReady()
      } catch (error) {
        localStream = null
        set({
          enabled: false,
          permission: 'denied',
          status: 'idle',
          error: 'No se pudo acceder al microfono.',
        })
      }
    },

    stop: () => {
      leaveJoinedRoom()
      stopRelayCapture()
      stopRelayOutput()
      stopSpeechMeter(LOCAL_SPEAKER_ID)
      localStream?.getTracks().forEach(track => track.stop())
      localStream = null
      set({
        enabled: false,
        micOpen: false,
        permission: 'idle',
        status: 'idle',
        error: null,
        speakingPeerIds: [],
      })
    },

    toggleMic: () => {
      micWantedRef = !get().micWanted
      set({ micWanted: micWantedRef })
      applyMicState()
    },

    setInputDevice: async (deviceId = '') => {
      selectedInputDeviceIdRef = deviceId
      saveDeviceId(VOICE_INPUT_DEVICE_KEY, deviceId)
      set({ selectedInputDeviceId: deviceId, error: null })
      if (!get().enabled) return

      set({ status: 'connecting' })
      try {
        const nextStream = await requestMicrophoneStream(deviceId)
        await replaceLocalStream(nextStream)
        set({ selectedInputDeviceId: selectedInputDeviceIdRef, status: 'connected' })
        refreshDevices()
      } catch {
        set({ error: 'No se pudo cambiar el microfono.', status: 'connected' })
      }
    },

    setOutputDevice: (deviceId = '') => {
      selectedOutputDeviceIdRef = deviceId
      saveDeviceId(VOICE_OUTPUT_DEVICE_KEY, deviceId)
      set({ selectedOutputDeviceId: deviceId })
      if (relayOutput?.audio) applyOutputDevice(relayOutput.audio)
    },

    testMicrophone: async () => {
      if (!supportsVoice()) {
        set({ error: 'Este navegador no soporta prueba de microfono.' })
        return
      }

      const runId = micTestRunId + 1
      micTestRunId = runId
      set({
        micTestActive: true,
        micTestLevel: 0,
        micTestStatus: 'Habla ahora para probar tu microfono.',
        error: null,
      })

      let tempStream = null
      let source = null
      try {
        const stream = localStream || await requestMicrophoneStream()
        if (!localStream) tempStream = stream
        refreshDevices()
        const context = await ensureAudioContext()
        if (!context) throw new Error('missing-audio-context')
        const analyser = context.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.72
        source = context.createMediaStreamSource(stream)
        source.connect(analyser)
        const data = new Uint8Array(analyser.fftSize)
        const startedAt = performance.now()
        let peak = 0

        const finish = () => {
          try { source?.disconnect() } catch {}
          tempStream?.getTracks().forEach(track => track.stop())
          if (micTestRunId !== runId) return
          set({
            micTestActive: false,
            micTestLevel: peak,
            micTestStatus: peak > 0.16 ? 'Microfono detectado correctamente.' : 'Se detecto poca voz. Revisa entrada o permisos.',
          })
        }

        const tick = () => {
          if (micTestRunId !== runId) {
            finish()
            return
          }
          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i += 1) {
            const value = (data[i] - 128) / 128
            sum += value * value
          }
          const level = Math.min(1, Math.sqrt(sum / data.length) * 7)
          peak = Math.max(peak, level)
          set({ micTestLevel: level })
          if (performance.now() - startedAt < 2400) requestAnimationFrame(tick)
          else finish()
        }

        requestAnimationFrame(tick)
      } catch {
        try { source?.disconnect() } catch {}
        tempStream?.getTracks().forEach(track => track.stop())
        if (micTestRunId === runId) {
          set({
            micTestActive: false,
            micTestLevel: 0,
            micTestStatus: 'No se pudo probar el microfono.',
          })
        }
      }
    },

    testOutput: async () => {
      const runId = outputTestRunId + 1
      outputTestRunId = runId
      set({ outputTestActive: true, outputTestStatus: 'Reproduciendo prueba de sonido.', error: null })

      let audio = null
      let destination = null
      const nodes = []
      try {
        const context = await ensureAudioContext()
        if (!context) throw new Error('missing-audio-context')
        destination = context.createMediaStreamDestination()
        audio = new Audio()
        audio.srcObject = destination.stream
        audio.volume = 1
        await applyOutputDevice(audio)
        await audio.play()

        const startAt = context.currentTime + 0.04
        ;[440, 660, 880].forEach((frequency, index) => {
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(frequency, startAt + index * 0.22)
          gain.gain.setValueAtTime(0, startAt + index * 0.22)
          gain.gain.linearRampToValueAtTime(0.72, startAt + index * 0.22 + 0.035)
          gain.gain.linearRampToValueAtTime(0, startAt + index * 0.22 + 0.18)
          oscillator.connect(gain)
          gain.connect(destination)
          oscillator.start(startAt + index * 0.22)
          oscillator.stop(startAt + index * 0.22 + 0.2)
          nodes.push(oscillator, gain)
        })

        setTimeout(() => {
          nodes.forEach(node => {
            try { node.disconnect() } catch {}
          })
          if (audio) {
            audio.pause()
            audio.srcObject = null
          }
          if (outputTestRunId === runId) {
            set({ outputTestActive: false, outputTestStatus: 'Si escuchaste tres tonos, la salida funciona.' })
          }
        }, 950)
      } catch {
        nodes.forEach(node => {
          try { node.disconnect() } catch {}
        })
        if (audio) {
          audio.pause()
          audio.srcObject = null
        }
        if (outputTestRunId === runId) {
          set({ outputTestActive: false, outputTestStatus: 'No se pudo reproducir la prueba de sonido.' })
        }
      }
    },

    setOutputVolume: (value) => {
      const outputVolume = Math.max(0, Math.min(1, Number(value)))
      saveVolume(outputVolume)
      set({ outputVolume })
    },

    setPeerVolume: (peerId, value) => {
      if (!peerId) return
      const volume = Math.max(0, Math.min(1, Number(value)))
      peerVolumePrefs = {
        ...peerVolumePrefs,
        [peerVolumeKey(peerId)]: volume,
      }
      savePeerVolumePrefs()
      set((state) => ({
        peerVolumes: {
          ...state.peerVolumes,
          [peerId]: volume,
        },
      }))
    },

    clearError: () => set({ error: null }),
  }
})
