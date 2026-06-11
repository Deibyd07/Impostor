import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import { useGameStore } from '../../store/gameStore.js'

export default function CardHidden() {
  const navigate = useNavigate()
  const session = useGameStore(s => s.session)
  const advance = useGameStore(s => s.advanceReveal)

  if (!session) { navigate('/'); return null }
  const isLast = session.revealIndex >= session.players.length - 1

  const next = () => {
    advance()
    if (isLast) navigate('/game')
    else navigate('/game/pass')
  }

  return (
    <PhoneScreen padTop={false} padBottom={false}>
      <div style={{
        position: 'relative', zIndex: 3,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 40px',
      }}>
        <div style={{
          width: 110, height: 110, borderRadius: 999,
          border: '1px solid rgba(214, 164, 80, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px -10px rgba(214, 164, 80, 0.3), inset 0 0 30px rgba(214, 164, 80, 0.05)',
          marginBottom: 36,
        }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <path d="M14 28 L 24 38 L 42 18" stroke="var(--gold)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"
                  style={{ filter: 'drop-shadow(0 0 8px var(--gold))' }} />
          </svg>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24,
          textAlign: 'center', letterSpacing: '0.08em', color: 'var(--text-1)',
          marginBottom: 14,
        }}>CARTA OCULTADA</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: 14,
          color: 'var(--text-2)', textAlign: 'center', marginBottom: 56,
        }}>{isLast ? 'Todos memorizaron su carta.' : 'Pasa el teléfono al siguiente jugador.'}</div>
        <button className="btn btn-primary" onClick={next}
          style={{ padding: '16px 20px', letterSpacing: '0.22em', maxWidth: 320 }}>
          {isLast ? 'Comenzar partida' : 'Siguiente'}
        </button>
      </div>
    </PhoneScreen>
  )
}
