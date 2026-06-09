import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import VoteCard from '../../components/VoteCard.jsx'
import EliminationEffect from '../../components/EliminationEffect.jsx'
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

  useEffect(() => {
    sfx.startVoting()
  }, [])

  if (!session) { navigate('/'); return null }
  const activePlayers = session.players.filter(p => !p.eliminated)
  const leader = leaderInVotes(session.votes, session.players)

  const onConfirm = () => {
    if (!leader?.winner) return
    const wasImpostor = isPlayerImpostor(session, leader.winner)
    const target = session.players.find(p => p.id === leader.winner)
    sfx.eliminate({ wasImpostor })
    setPendingReveal({
      id: `${leader.winner}-${Date.now()}`,
      playerId: leader.winner,
      name: target?.name,
      avatar: target?.avatar,
      wasImpostor,
    })
  }

  const onCloseReveal = () => {
    confirmElimination()
    setPendingReveal(null)
    setTimeout(() => {
      const updated = useGameStore.getState().session
      if (!updated || updated.phase === 'ended') navigate('/game/end')
      else navigate('/game')
    }, 0)
  }

  return (
    <PhoneScreen
      footer={leader?.hasMajority && !pendingReveal ? (
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
        }}>Cancelar</button>
        <button onClick={clearVotes} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-faint)',
          fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>Reiniciar votos</button>
      </div>

      <div style={{ padding: '0 20px 28px', textAlign: 'center' }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Votacion - Ronda {session.round}</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 26, color: 'var(--impostor)', letterSpacing: '0.06em',
          textShadow: '0 0 20px var(--impostor-glow)', lineHeight: 1.1,
        }}>QUIEN ES<br />EL IMPOSTOR?</div>
      </div>

      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {activePlayers.map((p) => (
            <VoteCard
              key={p.id}
              name={p.name}
              avatar={p.avatar}
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
            Toca un jugador para anadir un voto. Se necesita mayoria clara para eliminar.
          </div>
        )}
      </div>

      <EliminationEffect reveal={pendingReveal} onComplete={onCloseReveal} />
    </PhoneScreen>
  )
}
