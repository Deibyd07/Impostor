import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader.jsx'

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
  const isDetective = role === 'detective'
  const remaining = secondsLeft(interrogation?.expiresAt, now)
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
    <div style={{ marginBottom: 24 }}>
      {interrogation && (
        <>
          <SectionHeader right={remaining > 0 ? `${remaining}s` : 'Cerrando'}>Interrogatorio</SectionHeader>
          <div style={{
            border: '1px solid rgba(245, 158, 11, 0.42)',
            borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.13), rgba(245, 158, 11, 0.04))',
            boxShadow: '0 0 30px -18px var(--gold-glow)',
            padding: '14px 16px',
            marginBottom: isDetective ? 14 : 0,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}>
              <Avatar value={interrogation.targetAvatar} name={interrogation.targetName} active />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  letterSpacing: '0.04em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{interrogation.targetName}</div>
                <div style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  color: 'var(--gold)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}>Bajo presion</div>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(245, 158, 11, 0.18)',
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              lineHeight: 1.45,
              color: 'var(--text-1)',
            }}>{interrogation.prompt}</div>

            <div style={{
              marginTop: 10,
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: 'var(--text-3)',
              lineHeight: 1.4,
            }}>
              Iniciado por {interrogation.detectiveName}. El sistema no da veredicto.
            </div>
          </div>
        </>
      )}

      {isDetective && !interrogation && (
        <>
          <SectionHeader>Detective</SectionHeader>
          <div style={{
            border: '1px solid var(--hairline-cold)',
            borderRadius: 14,
            background: 'var(--surface-1)',
            padding: 14,
          }}>
            {used ? (
              <div style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                color: 'var(--text-2)',
                lineHeight: 1.45,
                textAlign: 'center',
              }}>Ya usaste tu interrogatorio en esta partida.</div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}>
                  {candidates.map(player => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setSelectedId(player.id)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        maxWidth: '100%',
                        padding: '7px 11px 7px 7px',
                        borderRadius: 999,
                        border: `1px solid ${selectedId === player.id ? 'var(--gold)' : 'var(--hairline-cold)'}`,
                        background: selectedId === player.id ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-2)',
                        color: selectedId === player.id ? 'var(--gold)' : 'var(--text-1)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 13,
                      }}
                    >
                      <Avatar value={player.avatar} name={player.name} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 112,
                      }}>{player.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!selected}
                  onClick={() => selected && onStart?.(selected.id)}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 16px',
                    cursor: selected ? 'pointer' : 'not-allowed',
                    background: selected
                      ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))'
                      : 'rgba(255,255,255,0.08)',
                    color: selected ? '#07070f' : 'var(--text-3)',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                  }}
                >
                  {selected ? `Interrogar a ${selected.name}` : 'Elige un jugador'}
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
  const display = value || (name || '?').trim().charAt(0).toUpperCase()
  return (
    <span style={{
      width: active ? 34 : 26,
      height: active ? 34 : 26,
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: active
        ? 'linear-gradient(135deg, #3a250b, #1f1608)'
        : 'linear-gradient(135deg, #2a2a45, #15152a)',
      border: `1px solid ${active ? 'rgba(245, 158, 11, 0.55)' : 'rgba(245, 158, 11, 0.2)'}`,
      fontSize: active ? 18 : 15,
      lineHeight: 1,
    }}>{display}</span>
  )
}
