import { useEffect, useMemo, useRef } from 'react'
import { useOnlineStore } from '../store/onlineStore.js'
import { VOICE_REMOTE_GAIN_BOOST, useVoiceStore } from '../store/voiceStore.js'
import { resolveVoiceChannel } from '../utils/voiceChannels.js'

export default function VoiceRoom() {
  const socket = useOnlineStore(s => s.socket)
  const roomCode = useOnlineStore(s => s.roomCode)
  const myId = useOnlineStore(s => s.myId)
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const detectiveInterrogation = useOnlineStore(s => s.detectiveInterrogation)
  const bindSocket = useVoiceStore(s => s.bindSocket)
  const setRoomContext = useVoiceStore(s => s.setRoomContext)
  const setCanSpeak = useVoiceStore(s => s.setCanSpeak)
  const setAllowedPeerIds = useVoiceStore(s => s.setAllowedPeerIds)
  const stopVoice = useVoiceStore(s => s.stop)
  const remoteStreams = useVoiceStore(s => s.remoteStreams)
  const outputVolume = useVoiceStore(s => s.outputVolume)
  const peerVolumes = useVoiceStore(s => s.peerVolumes)
  const selectedOutputDeviceId = useVoiceStore(s => s.selectedOutputDeviceId)

  const voiceChannel = useMemo(() => {
    return resolveVoiceChannel({
      roomCode,
      myId,
      players,
      phase,
      interrogation: detectiveInterrogation,
    })
  }, [detectiveInterrogation, myId, phase, players, roomCode])

  const audiblePeerIds = useMemo(() => (
    voiceChannel.allowedPeerIds ? new Set(voiceChannel.allowedPeerIds) : null
  ), [voiceChannel.allowedPeerIds])

  useEffect(() => {
    bindSocket(socket)
  }, [bindSocket, socket])

  useEffect(() => {
    setRoomContext({ roomCode, myId, players })
  }, [myId, players, roomCode, setRoomContext])

  useEffect(() => {
    setCanSpeak(voiceChannel.canSpeak, voiceChannel.reason)
  }, [setCanSpeak, voiceChannel.canSpeak, voiceChannel.reason])

  useEffect(() => {
    setAllowedPeerIds(voiceChannel.allowedPeerIds)
  }, [setAllowedPeerIds, voiceChannel.allowedPeerIds])

  useEffect(() => {
    if (!roomCode) stopVoice()
  }, [roomCode, stopVoice])

  return (
    <>
      {remoteStreams.map(entry => (
        <RemoteAudio
          key={entry.key}
          stream={entry.stream}
          volume={outputVolume * (peerVolumes[entry.peerId] ?? 1)}
          outputDeviceId={selectedOutputDeviceId}
          muted={audiblePeerIds ? !audiblePeerIds.has(entry.peerId) : false}
        />
      ))}
    </>
  )
}

function RemoteAudio({ stream, volume, outputDeviceId, muted }) {
  const ref = useRef(null)
  const graphRef = useRef(null)

  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    let cancelled = false

    const setup = async () => {
      cleanupGraph(graphRef.current)
      graphRef.current = null

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (!AudioContextClass) throw new Error('missing-audio-context')
        const context = new AudioContextClass()
        if (context.state === 'suspended') {
          await context.resume()
        }
        if (context.state !== 'running') {
          throw new Error('audio-context-suspended')
        }
        const source = context.createMediaStreamSource(stream)
        const gain = context.createGain()
        const destination = context.createMediaStreamDestination()
        gain.gain.value = Math.max(0, Number(volume) || 0) * VOICE_REMOTE_GAIN_BOOST
        source.connect(gain)
        gain.connect(destination)
        if (cancelled) {
          cleanupGraph({ context, source, gain, destination })
          return
        }
        graphRef.current = { context, source, gain, destination }
        audio.srcObject = destination.stream
        audio.volume = 1
        await applySink(audio, outputDeviceId)
        audio.muted = muted
        audio.play?.().catch(() => {})
      } catch {
        cleanupGraph(graphRef.current)
        graphRef.current = null
        audio.srcObject = stream
        audio.volume = Math.min(1, Math.max(0, Number(volume) || 0) * VOICE_REMOTE_GAIN_BOOST)
        await applySink(audio, outputDeviceId)
        audio.muted = muted
        audio.play?.().catch(() => {})
      }
    }

    setup()
    return () => {
      cancelled = true
      cleanupGraph(graphRef.current)
      graphRef.current = null
    }
  }, [muted, outputDeviceId, stream])

  useEffect(() => {
    const audio = ref.current
    const boostedVolume = Math.max(0, Number(volume) || 0) * VOICE_REMOTE_GAIN_BOOST
    if (graphRef.current?.gain) {
      graphRef.current.gain.gain.value = boostedVolume
      if (audio) audio.volume = 1
      return
    }
    if (audio) audio.volume = Math.min(1, boostedVolume)
  }, [volume])

  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    audio.muted = muted
  }, [muted])

  useEffect(() => {
    if (ref.current) applySink(ref.current, outputDeviceId)
  }, [outputDeviceId])

  return <audio ref={ref} autoPlay playsInline />
}

async function applySink(audio, outputDeviceId) {
  if (!audio || typeof audio.setSinkId !== 'function') return
  try {
    await audio.setSinkId(outputDeviceId || '')
  } catch {}
}

function cleanupGraph(graph) {
  if (!graph) return
  try { graph.source?.disconnect() } catch {}
  try { graph.gain?.disconnect() } catch {}
  try { graph.context?.close?.() } catch {}
}
