import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import VoteCard from '../../components/VoteCard.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { leaderInVotes, isPlayerImpostor } from '../../utils/gameLogic.js'
import { sfx } from '../../utils/sfx.js'

export default function Voting() {
  const navigate = useNavigate()
  const session = useGameStore(s => s.session)
  const castVote = useGameStore(s => s.castVote)
  const clearVotes = useGameStore(s => s.clearVotes)
  const confirmElimination = useGameStore(s => s.confirmElimination)
  const [pendingReveal, setPendingReveal] = useState(null)

  if (!session) { navigate('/'); return null }
  const activePlayers = session.players.filter(p => !p.eliminated)
  const leader = leaderInVotes(session.votes, session.players)

  const onConfirm = () => {
    if (!leader?.winner) return
    const wasImpostor = isPlayerImpostor(session, leader.winner)
    const target = session.players.find(p => p.id === leader.winner)
    sfx.eliminate()
    setPendingReveal({ playerId: leader.winner, name: target?.name, wasImpostor })
  }

  const onCloseReveal = () => {
    confirmElimination()
    setPendingReveal(null)
    // navegar dependiendo si terminó la partida
    setTimeout(() => {
      const updated = useGameStore.getState().session
      if (!updated || updated.phase === 'ended') navigate('/game/end')
      else navigate('/game')
    }, 0)
  }

  return (
    <PhoneScreen
      footer={leader?.hasMajority ? (
        <button className="btn btn-primary" onClick={onConfirm}
          style={{ padding: '18px 20px', letterSpacing: '0.2em' }}>
          Eliminar a {session.players.find(p => p.id === leader.winner)?.name}
        </button>
      ) : null}
    >
      <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => { clearVotes(); navigate('/game') }} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13,
        }}>← Cancelar</button>
        <button onClick={clearVotes} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-faint)',
          fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>Reiniciar votos</button>
      </div>

      <div style={{ padding: '0 20px 28px', textAlign: 'center' }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Votación · Ronda {session.round}</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 26, color: 'var(--impostor)', letterSpacing: '0.06em',
          textShadow: '0 0 20px var(--impostor-glow)', lineHeight: 1.1,
        }}>¿QUIÉN ES<br />EL IMPOSTOR?</div>
      </div>

      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {activePlayers.map((p) => (
            <VoteCard
              key={p.id}
              name={p.name}
              votes={session.votes[p.id] || 0}
              isLeader={leader?.hasMajority && leader.winner === p.id}
              onClick={() => { sfx.vote(); castVote(p.id) }}
            />
          ))}
        </div>

        {!leader?.hasMajority && (
          <div style={{
            marginTop: 22, textAlign: 'center',
            fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: 12,
            color: 'var(--text-3)', letterSpacing: '0.04em', padding: '0 24px',
          }}>
            Toca un jugador para añadir un voto. Se necesita mayoría clara para eliminar.
          </div>
        )}
      </div>

      {pendingReveal && (
        <EliminationReveal
          name={pendingReveal.name}
          wasImpostor={pendingReveal.wasImpostor}
          onClose={onCloseReveal}
        />
      )}
    </PhoneScreen>
  )
}

function EliminationReveal({ name, wasImpostor, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: wasImpostor
        ? 'radial-gradient(circle at center, rgba(34, 197, 94, 0.25), rgba(0,0,0,0.9))'
        : 'radial-gradient(circle at center, rgba(220, 38, 38, 0.25), rgba(0,0,0,0.9))',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'cardReveal 0.5s ease both',
    }}>
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'var(--surface-1)',
        border: `1px solid ${wasImpostor ? 'var(--victory)' : 'var(--impostor)'}`,
        borderRadius: 20, padding: '28px 24px',
        boxShadow: wasImpostor
          ? '0 0 60px -10px var(--victory-glow)'
          : '0 0 60px -10px var(--impostor-glow)',
        textAlign: 'center',
      }}>
        <div className="t-eyebrow" style={{ color: wasImpostor ? 'var(--victory)' : 'var(--impostor)', marginBottom: 8 }}>
          {wasImpostor ? 'ATRAPADO' : 'ERROR'}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
          letterSpacing: '0.04em', color: 'var(--text-1)', marginBottom: 12,
        }}>{name?.toUpperCase()}</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-2)',
          fontStyle: 'italic', marginBottom: 24, lineHeight: 1.5,
        }}>
          {wasImpostor
            ? 'Era el impostor. La mesa acierta esta ronda.'
            : 'No era el impostor. Continúa la partida con un jugador menos.'}
        </div>
        <button className="btn btn-primary" onClick={onClose}
          style={{ padding: '14px 20px', letterSpacing: '0.18em' }}>
          Continuar
        </button>
      </div>
    </div>
  )
}
