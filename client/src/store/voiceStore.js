import { create } from 'zustand'

const VOICE_VOLUME_KEY = 'el-impostor-voice-volume'
const VOICE_PEER_VOLUME_KEY = 'el-impostor-voice-peer-volumes'
export const LOCAL_SPEAKER_ID = '__local__'
const VOICE_JOIN_RETRY_DELAY_MS = 450
const PEER_RECONNECT_DELAY_MS = 900
const SPEECH_THRESHOLD = 0.035
const SPEECH_HOLD_MS = 360
const SPEECH_POLL_MS = 90
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
let audioContext = null
let speechMeters = new Map()
let speechLoopId = null
let lastSpeechPublishAt = 0
let lastSpeakingKey = ''
let socketHandlers = null
let voiceJoinRetryTimer = null
let peerReconnectTimers = new Map()

function loadVolume() {
  try {
    const value = Number(localStorage.getItem(VOICE_VOLUME_KEY))
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.9
  } catch {
    return 0.9
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

function supportsVoice() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof RTCPeerConnection !== 'undefined'
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
    const speakingPeerIds = [...speechMeters.entries()]
      .filter(([peerId, meter]) => {
        if (peerId === LOCAL_SPEAKER_ID && !get().micOpen) return false
        return Date.now() - meter.lastSpokeAt < SPEECH_HOLD_MS
      })
      .map(([peerId]) => peerId)
      .sort()
    const key = speakingPeerIds.join('|')
    if (!force && key === lastSpeakingKey) return
    lastSpeakingKey = key
    set({ speakingPeerIds })
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
    stopSpeechMeter(peerId)
    publishRemoteStreams()
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
    stopRemoteSpeechMeters()
    publishRemoteStreams()
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
    }

    socketRef.on('connect', socketHandlers.connect)
    socketRef.on('disconnect', socketHandlers.disconnect)
    socketRef.on('voice:peers', socketHandlers.voicePeers)
    socketRef.on('voice:peerJoined', socketHandlers.voicePeerJoined)
    socketRef.on('voice:peerLeft', socketHandlers.voicePeerLeft)
    socketRef.on('voice:signal', socketHandlers.voiceSignal)
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

    bindSocket,

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
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        micWantedRef = true
        set({ enabled: true, micWanted: true, permission: 'granted', status: 'ready' })
        startSpeechMeter(LOCAL_SPEAKER_ID, localStream)
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
