import { useEffect, useMemo, useRef } from 'react'
import { useOnlineStore } from '../store/onlineStore.js'
import { useVoiceStore } from '../store/voiceStore.js'
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
          muted={audiblePeerIds ? !audiblePeerIds.has(entry.peerId) : false}
        />
      ))}
    </>
  )
}

function RemoteAudio({ stream, volume, muted }) {
  const ref = useRef(null)

  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    audio.srcObject = stream
    audio.volume = volume
    audio.muted = muted
    audio.play?.().catch(() => {})
  }, [muted, stream, volume])

  useEffect(() => {
    if (ref.current) ref.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (ref.current) ref.current.muted = muted
  }, [muted])

  return <audio ref={ref} autoPlay playsInline />
}
