import { create } from 'zustand'

const VOICE_VOLUME_KEY = 'el-impostor-voice-volume'
const VOICE_PEER_VOLUME_KEY = 'el-impostor-voice-peer-volumes'
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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
    const peer = peers.get(peerId)
    if (peer) {
      try { peer.pc.close() } catch {}
      peers.delete(peerId)
    }
    pendingCandidates.delete(peerId)
    remoteStreams.delete(peerId)
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
    peers.forEach(({ pc }) => {
      try { pc.close() } catch {}
    })
    peers = new Map()
    pendingCandidates = new Map()
    remoteStreams = new Map()
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
      setPeer(peerId, { status: 'connected' })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        setPeer(peerId, { status: pc.connectionState })
        if (pc.connectionState === 'failed') removePeer(peerId)
        return
      }
      if (pc.connectionState === 'connected') setPeer(peerId, { status: 'connected' })
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
    if (socketRef && joinedRoomCode) {
      socketRef.emit('voice:leave')
    }
    joinedRoomCode = null
    closeAllPeers()
  }

  const joinIfReady = () => {
    if (!get().enabled || !socketRef || !roomCodeRef || !localStream) return
    if (joinedRoomCode && joinedRoomCode !== roomCodeRef) leaveJoinedRoom()
    if (joinedRoomCode === roomCodeRef) return
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
      socketRef.off('voice:peers')
      socketRef.off('voice:peerJoined')
      socketRef.off('voice:peerLeft')
      socketRef.off('voice:signal')
    }
    socketRef = socket || null
    if (!socketRef) {
      leaveJoinedRoom()
      return
    }

    socketRef.on('voice:peers', ({ peers: peerIds = [] } = {}) => {
      const allowedPeers = peerIds.filter(peerId => peerId !== myIdRef && isPeerAllowed(peerId))
      set({ status: allowedPeers.length ? 'connecting' : 'connected' })
      allowedPeers.forEach(registerAvailablePeer)
    })
    socketRef.on('voice:peerJoined', ({ peerId } = {}) => {
      registerAvailablePeer(peerId)
    })
    socketRef.on('voice:peerLeft', ({ peerId } = {}) => {
      if (peerId) removePeer(peerId)
    })
    socketRef.on('voice:signal', handleSignal)
    joinIfReady()
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
      else joinIfReady()
    },

    setAllowedPeerIds: (peerIds) => {
      const nextAllowedPeerIds = normalizeAllowedPeerIds(peerIds)
      if (sameAllowedPeerIds(allowedPeerIdsRef, nextAllowedPeerIds)) return

      allowedPeerIdsRef = nextAllowedPeerIds
      ;[...peers.keys()].forEach(peerId => {
        if (!isPeerAllowed(peerId)) removePeer(peerId)
      })

      if (get().enabled && socketRef && joinedRoomCode && localStream) {
        set({ status: 'connecting' })
        socketRef.emit('voice:join')
      }
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
      localStream?.getTracks().forEach(track => track.stop())
      localStream = null
      set({
        enabled: false,
        micOpen: false,
        permission: 'idle',
        status: 'idle',
        error: null,
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
