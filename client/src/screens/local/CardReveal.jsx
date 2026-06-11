import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import RoleCard from '../../components/RoleCard.jsx'
import CardSlamFlip from '../../components/CardSlamFlip.jsx'
import { useTimer } from '../../hooks/useTimer.js'
import { useGameStore } from '../../store/gameStore.js'
import { sfx } from '../../utils/sfx.js'
import { isImpostorRole } from '../../utils/roles.js'

const TOTAL_SECONDS = 8

export default function CardReveal() {
  const navigate = useNavigate()
  const session = useGameStore(s => s.session)

  if (!session) { navigate('/'); return null }
  const i = session.revealIndex
  const player = session.players[i]
  if (!player) { navigate('/game'); return null }

  const variant = computeVariant(session, player)

  useEffect(() => {
    sfx.revealRole(variant, { concealBlind: true })
  }, [variant])
  const word = player.seenWord ?? (
    isImpostorRole(player.role)
      ? (session.config.mode === 'blind' ? session.fakeWord : '')
      : session.word
  )
  const clue = session.clue
  const impostorTeammates = variant !== 'impostor-blind' && isImpostorRole(player.role)
    ? session.players
      .filter(candidate => candidate.id !== player.id && isImpostorRole(candidate.role))
      .map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        avatar: candidate.avatar,
      }))
    : []

  const { seconds } = useTimer(TOTAL_SECONDS, { autoStart: true })

  return (
    <PhoneScreen padTop={false} padBottom={false}>
      <div style={{
        position: 'relative', zIndex: 3,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        padding: '70px 24px 32px',
      }}>
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-faint)',
          letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 24,
        }}>Memoriza · Oculta · Pasa</div>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CardSlamFlip>
            <RoleCard
              variant={variant}
              word={word}
              clue={clue}
              impostorTeammates={impostorTeammates}
              seconds={seconds}
              totalSeconds={TOTAL_SECONDS}
            />
          </CardSlamFlip>
        </div>

        <button className="btn btn-secondary" onClick={() => navigate('/game/hidden')} style={{
          marginTop: 24, padding: '16px 20px', letterSpacing: '0.22em',
        }}>
          ✓ He memorizado mi carta
        </button>
      </div>
    </PhoneScreen>
  )
}

function computeVariant(session, player) {
  if (player.role === 'detective-impostor') return 'detective-impostor'
  if (player.role === 'detective' || player.role === 'detective-blind') return 'detective'
  if (player.role === 'citizen') return 'citizen'
  // impostor
  if (session.config.mode === 'blind') return 'impostor-blind'
  if (session.config.mode === 'clue')  return 'impostor-clue'
  return 'impostor'
}
