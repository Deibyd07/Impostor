import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import TimerBar from '../../components/TimerBar.jsx'
import PlayerChip from '../../components/PlayerChip.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { useTimer } from '../../hooks/useTimer.js'
import { isImpostorRole } from '../../utils/roles.js'

const MODE_LABEL = { classic: 'Clásico', clue: 'Con Pista', blind: 'Impostor Ciego' }
const MODE_COLOR = { classic: 'var(--impostor)', clue: 'var(--gold)', blind: 'var(--citizen)' }

export default function GameBoard() {
  const navigate = useNavigate()
  const session = useGameStore(s => s.session)
  const newRound = useGameStore(s => s.newRound)
  const endSession = useGameStore(s => s.endSession)
  const [paused, setPaused] = useState(false)
  const [showReveal, setShowReveal] = useState(false)

  if (!session) { navigate('/'); return null }
  if (session.phase === 'ended') { navigate('/game/end'); return null }

  const totalRoundSeconds = useMemo(() => {
    const t = session.config.roundTime
    if (t === 'free') return null
    return parseInt(t, 10) * 60
  }, [session.config.roundTime, session.round])

  const timer = useTimer(totalRoundSeconds ?? 0, { autoStart: !!totalRoundSeconds })
  useEffect(() => {
    if (paused) timer.pause()
    else timer.start()
  }, [paused])

  const activeCount = session.players.filter(p => !p.eliminated).length
  const onVote = () => navigate('/game/vote')
  const onPause = () => setPaused(p => !p)
  const onReveal = () => setShowReveal(true)
  const onNewRound = () => { newRound(); setPaused(false); timer.reset(totalRoundSeconds ?? 0) }
  const onExit = () => { if (confirm('¿Salir de la partida? Se perderá el progreso.')) { endSession(); navigate('/') } }

  return (
    <PhoneScreen>
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onExit} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13,
        }}>← Salir</button>
        <Badge color={MODE_COLOR[session.config.mode]} dot>{MODE_LABEL[session.config.mode]}</Badge>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="evidence-panel evidence-panel--hero" style={{
          background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
          border: '1px solid var(--hairline-cold)',
          borderRadius: 18, padding: '18px 18px 16px',
          marginBottom: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.5,
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div className="t-eyebrow" style={{ fontSize: 10 }}>Ronda en curso</div>
              <div style={{
                fontFamily: 'var(--font-num)', fontSize: 56, lineHeight: 0.9,
                color: 'var(--text-1)', marginTop: 6, letterSpacing: '0.04em',
              }}>{String(session.round).padStart(2, '0')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="t-eyebrow" style={{ fontSize: 10 }}>Activos</div>
              <div style={{
                fontFamily: 'var(--font-num)', fontSize: 38, lineHeight: 0.9,
                color: 'var(--citizen)', marginTop: 6, textShadow: '0 0 12px var(--citizen-glow)',
              }}>{activeCount}<span style={{ color: 'var(--text-faint)', fontSize: 22 }}>/{session.players.length}</span></div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            {totalRoundSeconds ? (
              <TimerBar
                progress={timer.progress}
                totalSeconds={totalRoundSeconds}
                accent={paused ? 'gold' : 'red'}
                label={paused ? 'Pausado' : 'Tiempo restante'}
              />
            ) : (
              <div style={{
                fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-3)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>Modo libre · sin timer</div>
            )}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-2)',
          letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10,
        }}>Orden de turno</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
          {(session.speakOrder || session.players.map(p => p.id)).map((id, idx) => {
            const player = session.players.find(p => p.id === id)
            if (!player) return null
            return (
              <div key={id} className="evidence-row" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px',
                background: 'var(--surface-1)',
                border: '1px solid var(--hairline-cold)',
                borderRadius: 10,
                opacity: player.eliminated ? 0.32 : 1,
              }}>
                <span style={{
                  fontFamily: 'var(--font-num)', fontSize: 13,
                  color: 'var(--text-3)', minWidth: 18,
                }}>{idx + 1}</span>
                <PlayerChip name={player.name} avatar={player.avatar} eliminated={player.eliminated} />
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ActionTile icon="🗳" label="Votar" accent="red" primary onClick={onVote} />
          <ActionTile icon={paused ? '▶' : '⏸'} label={paused ? 'Reanudar' : 'Pausa'} onClick={onPause} />
          <ActionTile icon="🏳" label="Revelar" accent="gold" onClick={onReveal} />
          <ActionTile icon="🔄" label="Nueva ronda" onClick={onNewRound} />
        </div>
      </div>

      {showReveal && (
        <RevealModal session={session} onClose={() => setShowReveal(false)} />
      )}
    </PhoneScreen>
  )
}

function ActionTile({ icon, label, accent, primary, onClick }) {
  const c = accent === 'red' ? 'var(--impostor)'
          : accent === 'gold' ? 'var(--gold)' : 'var(--text-1)'
  const glow = accent === 'red' ? 'var(--impostor-glow)'
             : accent === 'gold' ? 'var(--gold-glow)' : 'transparent'
  return (
    <button type="button" onClick={onClick} className={`evidence-action-tile ${primary ? 'is-primary' : ''}`} style={{
      all: 'unset', cursor: 'pointer',
      padding: '20px 14px',
      background: primary
        ? 'linear-gradient(180deg, rgba(220, 38, 38, 0.16), rgba(220, 38, 38, 0.04))'
        : 'var(--surface-1)',
      border: `1px solid ${primary ? 'rgba(220, 38, 38, 0.5)' : 'var(--hairline-cold)'}`,
      borderRadius: 14,
      textAlign: 'left',
      boxShadow: primary ? `0 0 24px -10px ${glow}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
        letterSpacing: '0.16em', color: c, textTransform: 'uppercase',
      }}>{label}</div>
    </button>
  )
}

function RevealModal({ session, onClose }) {
  const impostors = session.players.filter(p => isImpostorRole(p.role))
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="evidence-modal-panel" style={{
        width: '100%', maxWidth: 360,
        background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
        border: '1px solid var(--gold)',
        borderRadius: 18, padding: 24,
        boxShadow: 'var(--sh-gold)',
        textAlign: 'center',
      }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Revelación</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
          color: 'var(--text-1)', marginBottom: 6,
        }}>La palabra era</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
          color: 'var(--gold-soft)', letterSpacing: '0.06em',
          textShadow: '0 0 20px var(--gold-glow)', marginBottom: 18,
        }}>{session.word.toUpperCase()}</div>
        {session.config.mode === 'blind' && session.fakeWord && (
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-2)',
            marginBottom: 18, fontStyle: 'italic',
          }}>El impostor creía: <strong style={{ color: 'var(--citizen)', fontStyle: 'normal' }}>{session.fakeWord}</strong></div>
        )}
        <div className="hr-gold-soft" style={{ margin: '16px 0' }} />
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Impostor{impostors.length > 1 ? 'es' : ''}</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          color: 'var(--impostor)', letterSpacing: '0.06em',
        }}>{impostors.map(p => p.name).join(' · ')}</div>
        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 20, padding: '14px 20px', letterSpacing: '0.18em' }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
