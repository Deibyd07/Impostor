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
          <div className="grain grain-heavy" style={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(245, 158, 11, 0.68)',
            borderRadius: 16,
            background:
              'radial-gradient(120% 90% at 50% -10%, rgba(245, 158, 11, 0.24), transparent 58%),' +
              'linear-gradient(180deg, rgba(36, 12, 12, 0.98), rgba(10, 8, 18, 0.98))',
            padding: '16px 16px 15px',
            marginBottom: isDetective ? 14 : 0,
            animation: 'detectiveSceneIn 420ms cubic-bezier(0.2, 0.8, 0.25, 1) both, detectivePulse 1.9s ease-in-out infinite',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.18), transparent)',
              animation: 'detectiveSweep 2.4s ease-in-out infinite',
            }} />
            <div style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: 14,
            }}>La mesa queda en silencio</div>

            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 10,
              alignItems: 'center',
              marginBottom: 14,
            }}>
              <Speaker
                label="Detective"
                name={interrogation.detectiveName}
                avatar={interrogation.detectiveAvatar}
                align="right"
              />
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.55)',
                color: 'var(--gold)',
                background: 'rgba(0,0,0,0.34)',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 13,
                boxShadow: '0 0 22px -8px var(--gold-glow)',
              }}>VS</div>
              <Speaker
                label="Interrogado"
                name={interrogation.targetName}
                avatar={interrogation.targetAvatar}
              />
            </div>

            <div style={{
              position: 'relative',
              zIndex: 2,
              padding: '15px 14px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.32)',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              lineHeight: 1.25,
              color: 'var(--text-1)',
              textAlign: 'center',
              textShadow: '0 0 18px rgba(245, 158, 11, 0.22)',
            }}>{interrogation.prompt}</div>

            <div style={{
              position: 'relative',
              zIndex: 2,
              marginTop: 12,
              padding: '9px 11px',
              borderRadius: 999,
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.24)',
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: '#fecaca',
              lineHeight: 1.35,
              textAlign: 'center',
            }}>
              Solo {interrogation.detectiveName} y {interrogation.targetName} tienen la palabra.
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

function Speaker({ label, name, avatar, align = 'left' }) {
  const isRight = align === 'right'
  return (
    <div style={{
      minWidth: 0,
      display: 'flex',
      flexDirection: isRight ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      textAlign: isRight ? 'right' : 'left',
    }}>
      <Avatar value={avatar} name={name} active />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: 3,
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{name}</div>
      </div>
    </div>
  )
}
