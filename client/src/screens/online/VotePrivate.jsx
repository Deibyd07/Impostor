import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import VoteCard from '../../components/VoteCard.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function VotePrivate() {
  const navigate = useNavigate()
  const players = useOnlineStore(s => s.players)
  const myId = useOnlineStore(s => s.myId)
  const phase = useOnlineStore(s => s.phase)
  const votedFor = useOnlineStore(s => s.votedFor)
  const votersReady = useOnlineStore(s => s.votersReady)
  const castVote = useOnlineStore(s => s.castVote)

  useEffect(() => {
    if (phase === 'voted') navigate('/online/vote-sent')
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  const activeOthers = players.filter(p => !p.eliminated && p.id !== myId)
  const totalActive = players.filter(p => !p.eliminated).length

  return (
    <PhoneScreen>
      <div style={{ padding: '0 20px 8px', textAlign: 'center', marginTop: 24 }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Voto privado</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 26, color: 'var(--impostor)', letterSpacing: '0.06em',
          textShadow: '0 0 20px var(--impostor-glow)', lineHeight: 1.1,
        }}>¿QUIÉN ES<br />EL IMPOSTOR?</div>
        <div style={{
          marginTop: 14, fontFamily: 'var(--font-ui)', fontStyle: 'italic',
          fontSize: 12, color: 'var(--text-3)',
        }}>Tu voto es irrevocable y privado.</div>
      </div>

      <div style={{ padding: '0 20px 24px', marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {activeOthers.map(p => (
            <VoteCard
              key={p.id}
              name={p.name}
              votes={0}
              disabled={!!votedFor}
              onClick={() => castVote(p.id)}
            />
          ))}
        </div>
        <div style={{
          marginTop: 22, textAlign: 'center',
          fontFamily: 'var(--font-num)', fontSize: 22,
          color: 'var(--gold)', letterSpacing: '0.05em',
        }}>{votersReady}<span style={{ color: 'var(--text-faint)', fontSize: 14 }}>/{totalActive} votaron</span></div>
      </div>
    </PhoneScreen>
  )
}
