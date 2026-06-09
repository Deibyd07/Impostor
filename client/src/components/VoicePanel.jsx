import SectionHeader from './SectionHeader.jsx'
import { useOnlineStore } from '../store/onlineStore.js'
import { LOCAL_SPEAKER_ID, useVoiceStore } from '../store/voiceStore.js'
import { resolveVoiceChannel } from '../utils/voiceChannels.js'

export default function VoicePanel({ compact = false }) {
  const players = useOnlineStore(s => s.players)
  const myId = useOnlineStore(s => s.myId)
  const roomCode = useOnlineStore(s => s.roomCode)
  const phase = useOnlineStore(s => s.phase)
  const detectiveInterrogation = useOnlineStore(s => s.detectiveInterrogation)
  const supported = useVoiceStore(s => s.supported)
  const enabled = useVoiceStore(s => s.enabled)
  const micWanted = useVoiceStore(s => s.micWanted)
  const micOpen = useVoiceStore(s => s.micOpen)
  const canSpeak = useVoiceStore(s => s.canSpeak)
  const suppressReason = useVoiceStore(s => s.suppressReason)
  const permission = useVoiceStore(s => s.permission)
  const status = useVoiceStore(s => s.status)
  const error = useVoiceStore(s => s.error)
  const peers = useVoiceStore(s => s.peers)
  const outputVolume = useVoiceStore(s => s.outputVolume)
  const peerVolumes = useVoiceStore(s => s.peerVolumes)
  const speakingPeerIds = useVoiceStore(s => s.speakingPeerIds)
  const start = useVoiceStore(s => s.start)
  const stop = useVoiceStore(s => s.stop)
  const toggleMic = useVoiceStore(s => s.toggleMic)
  const setOutputVolume = useVoiceStore(s => s.setOutputVolume)
  const setPeerVolume = useVoiceStore(s => s.setPeerVolume)

  const peerList = Object.values(peers)
  const speakingPeers = new Set(speakingPeerIds)
  const connectedCount = (enabled ? 1 : 0) + peerList.length
  const me = players.find(player => player.id === myId)
  const voiceChannel = resolveVoiceChannel({
    roomCode,
    myId,
    players,
    phase,
    interrogation: detectiveInterrogation,
  })
  const micLabel = !enabled
    ? 'Voz apagada'
    : micOpen
      ? 'Microfono abierto'
      : canSpeak
        ? 'Microfono silenciado'
        : 'Silencio de mesa'

  return (
    <section className={`voice-panel ${compact ? 'voice-panel--compact' : ''}`}>
      <SectionHeader right={enabled ? `${connectedCount} voz` : 'opcional'}>Voz de sala</SectionHeader>

      <div className="voice-panel__status">
        <span className={`voice-panel__pulse ${micOpen ? 'is-open' : enabled ? 'is-muted' : ''}`} />
        <div>
          <strong>{micLabel}</strong>
          <p>{statusText({ supported, enabled, permission, status, error, suppressReason, voiceChannel })}</p>
        </div>
      </div>

      {enabled && voiceChannel.channel !== 'room' && (
        <div className={`voice-panel__channel voice-panel__channel--${voiceChannel.channel}`}>
          <strong>{voiceChannel.channelLabel}</strong>
          <span>{voiceChannel.channelDescription}</span>
        </div>
      )}

      <div className="voice-panel__actions">
        {!enabled ? (
          <button type="button" className="voice-panel__primary" onClick={start} disabled={!supported || permission === 'prompting'}>
            {permission === 'prompting' ? 'Solicitando microfono' : 'Activar voz'}
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`voice-panel__primary ${micOpen ? 'is-live' : ''}`}
              onClick={toggleMic}
              disabled={!canSpeak}
            >
              {micWanted && canSpeak ? 'Silenciarme' : 'Abrir microfono'}
            </button>
            <button type="button" className="voice-panel__secondary" onClick={stop}>Salir de voz</button>
          </>
        )}
      </div>

      {enabled && (
        <label className="voice-panel__volume">
          <span>Volumen general</span>
          <strong>{Math.round(outputVolume * 100)}%</strong>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={outputVolume}
            onChange={event => setOutputVolume(event.target.value)}
          />
        </label>
      )}

      {enabled && (
        <div className="voice-panel__peers" aria-label="Jugadores en voz">
          <VoiceChip
            player={me}
            label="Tu"
            active={micOpen}
            muted={!micOpen}
            speaking={speakingPeers.has(LOCAL_SPEAKER_ID)}
          />
          {peerList.map(peer => (
            <VoiceChip
              key={peer.id}
              player={peer}
              label={peer.status === 'connected' ? 'Conectado' : 'Conectando'}
              active={peer.status === 'connected'}
              speaking={speakingPeers.has(peer.id)}
              volume={peerVolumes[peer.id] ?? 1}
              masterVolume={outputVolume}
              onVolumeChange={(value) => setPeerVolume(peer.id, value)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function VoiceChip({ player, label, active = false, muted = false, speaking = false, volume = null, masterVolume = 1, onVolumeChange }) {
  const name = player?.name || 'Jugador'
  const avatar = player?.avatar || name.trim().charAt(0).toUpperCase() || '?'
  const hasVolume = typeof onVolumeChange === 'function'
  const finalVolume = Math.round((Number(volume) || 0) * masterVolume * 100)
  return (
    <div className={`voice-chip ${hasVolume ? 'voice-chip--remote' : ''} ${active ? 'is-active' : ''} ${muted ? 'is-muted' : ''} ${speaking ? 'is-speaking' : ''}`}>
      <span>{avatar}</span>
      <div className="voice-chip__body">
        <div className="voice-chip__head">
          <strong>{name}</strong>
          {speaking && (
            <i className="voice-chip__speaking" aria-label="Hablando" title="Hablando">
              🔊
            </i>
          )}
          {hasVolume && <em>{finalVolume}%</em>}
        </div>
        <small>{hasVolume ? `${label} · volumen personal` : label}</small>
      </div>
      {hasVolume && (
        <label className="voice-chip__volume">
          <span className="sr-only">Volumen de {name}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={event => onVolumeChange(event.target.value)}
          />
        </label>
      )}
    </div>
  )
}

function statusText({ supported, enabled, permission, status, error, suppressReason, voiceChannel }) {
  if (!supported) return 'Tu navegador no soporta WebRTC de audio.'
  if (error) return error
  if (permission === 'denied') return 'Permiso de microfono denegado.'
  if (permission === 'prompting') return 'Acepta el permiso del microfono para entrar.'
  if (!enabled) return 'Activalo solo si quieres reemplazar la llamada externa.'
  if (suppressReason) return suppressReason
  if (voiceChannel?.channel && voiceChannel.channel !== 'room') return voiceChannel.channelDescription
  if (status === 'connecting') return 'Conectando voces de la sala...'
  return 'Escucha y habla con los jugadores conectados.'
}
