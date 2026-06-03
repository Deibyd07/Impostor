import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import RoleCard from '../../components/RoleCard.jsx'
import Badge from '../../components/Badge.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { useTimer } from '../../hooks/useTimer.js'

const TOTAL = 8

export default function MyCard() {
  const navigate = useNavigate()
  const myRole = useOnlineStore(s => s.myRole)
  const myWord = useOnlineStore(s => s.myWord)
  const myClue = useOnlineStore(s => s.myClue)
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const cardReady = useOnlineStore(s => s.cardReady)
  const myId = useOnlineStore(s => s.myId)
  const [readyClicked, setReadyClicked] = useState(false)
  const { seconds } = useTimer(TOTAL, { autoStart: true })

  useEffect(() => {
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'voting') navigate('/online/vote')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  if (!myRole) {
    return (
      <PhoneScreen>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          Esperando carta del servidor…
        </div>
      </PhoneScreen>
    )
  }

  const readyCount = players.filter(p => p.ready).length
  const total = players.length
  const me = players.find(p => p.id === myId)

  return (
    <PhoneScreen
      footer={
        <button
          className="btn btn-secondary"
          disabled={readyClicked}
          onClick={() => { cardReady(); setReadyClicked(true) }}
          style={{ padding: '16px 20px', letterSpacing: '0.22em' }}
        >
          {readyClicked ? `Esperando al resto (${readyCount}/${total})` : '✓ He memorizado mi carta'}
        </button>
      }
    >
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="t-eyebrow">Tu carta</span>
        <Badge color="var(--gold)" size="sm">{me?.name || ''}</Badge>
      </div>

      <div style={{
        padding: '0 24px',
        animation: 'cardReveal 0.7s cubic-bezier(0.2, 0.7, 0.3, 1) both',
      }}>
        <RoleCard
          variant={myRole}
          word={myWord}
          clue={myClue}
          seconds={seconds}
          totalSeconds={TOTAL}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 18, padding: '0 24px' }}>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-3)',
          letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 4,
        }}>Listos</div>
        <div style={{
          fontFamily: 'var(--font-num)', fontSize: 24,
          color: 'var(--gold)', letterSpacing: '0.05em',
        }}>{readyCount}<span style={{ color: 'var(--text-faint)', fontSize: 16 }}>/{total}</span></div>
      </div>
    </PhoneScreen>
  )
}
