import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'
import { isDetectiveRole } from '../utils/roles.js'

function secondsLeft(expiresAt, now) {
  if (!expiresAt) return 0
  return Math.max(0, Math.ceil((expiresAt - now) / 1000))
}

export default function DetectiveInterrogationPanel({
  players = [],
  myId,
  role,
  interrogation,
  used = false,
  onStart,
}) {
  const [selectedId, setSelectedId] = useState('')
  const [now, setNow] = useState(Date.now())
  const isDetective = isDetectiveRole(role)
  const remaining = secondsLeft(interrogation?.expiresAt, now)
  const canSeePrompt = !!interrogation?.prompt && (
    myId === interrogation.detectiveId || myId === interrogation.targetId
  )
  const candidates = players.filter(p => !p.eliminated && !p.disconnected && p.id !== myId)
  const selected = candidates.find(p => p.id === selectedId)

  useEffect(() => {
    if (!interrogation?.expiresAt) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [interrogation?.expiresAt])

  useEffect(() => {
    const stillAvailable = players.some(p => !p.eliminated && !p.disconnected && p.id !== myId && p.id === selectedId)
    if (selectedId && !stillAvailable) {
      setSelectedId('')
    }
  }, [players, selectedId, myId])

  if (!interrogation && !isDetective) return null

  return (
    <div className="di-slot">
      {interrogation && (
        <>
          <SectionHeader right={remaining > 0 ? `${remaining}s` : 'Cerrando'}>Interrogatorio</SectionHeader>
          {canSeePrompt ? (
            <div className="di-scene grain">
              <div className="di-scene__silence">La mesa queda en silencio</div>

              <div className="di-scene__faceoff">
                <Speaker
                  label="Detective"
                  name={interrogation.detectiveName}
                  avatar={interrogation.detectiveAvatar}
                  align="right"
                />
                <div className="di-scene__vs">VS</div>
                <Speaker
                  label="Interrogado"
                  name={interrogation.targetName}
                  avatar={interrogation.targetAvatar}
                />
              </div>

              <div className="di-scene__prompt">{interrogation.prompt}</div>

              <div className="di-scene__notice">
                Solo {interrogation.detectiveName} y {interrogation.targetName} tienen la palabra.
              </div>
            </div>
          ) : (
            <ObserverNotice interrogation={interrogation} remaining={remaining} />
          )}
        </>
      )}

      {isDetective && !interrogation && (
        <>
          <SectionHeader>Detective</SectionHeader>
          <div className="di-control">
            {used ? (
              <div className="di-control__used">Ya usaste tu interrogatorio en esta partida.</div>
            ) : (
              <>
                <div className="di-control__targets">
                  {candidates.map(player => (
                    <button
                      key={player.id}
                      type="button"
                      className={`di-target ${selectedId === player.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedId(player.id)}
                    >
                      <Avatar value={player.avatar} name={player.name} />
                      <span>{player.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="di-control__go"
                  disabled={!selected}
                  onClick={() => selected && onStart?.(selected.id)}
                >
                  {selected ? `Interrogar a ${selected.name}` : 'Elige un sospechoso'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Avatar({ value, name, active = false }) {
  return <PlayerAvatar avatar={value} name={name} className={`di-avatar ${active ? 'is-active' : ''}`} />
}

function Speaker({ label, name, avatar, align = 'left' }) {
  return (
    <div className={`di-speaker ${align === 'right' ? 'is-right' : ''}`}>
      <Avatar value={avatar} name={name} active />
      <div className="di-speaker__id">
        <span>{label}</span>
        <strong>{name}</strong>
      </div>
    </div>
  )
}

function ObserverNotice({ interrogation, remaining }) {
  return (
    <div className="di-observer">
      <div className="di-observer__head">
        <strong>Interrogatorio en curso</strong>
        <b>{remaining > 0 ? `${remaining}s` : '…'}</b>
      </div>

      <div className="di-observer__pair">
        <Avatar value={interrogation.detectiveAvatar} name={interrogation.detectiveName} />
        <i />
        <Avatar value={interrogation.targetAvatar} name={interrogation.targetName} />
        <p>
          <strong>{interrogation.detectiveName}</strong> y{' '}
          <strong>{interrogation.targetName}</strong> están hablando.
        </p>
      </div>

      <div className="di-observer__note">
        La pregunta es privada. Escucha la conversación y observa las respuestas.
      </div>
    </div>
  )
}
