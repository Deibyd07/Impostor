import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import { useGameStore } from '../../store/gameStore.js'

export default function PassPhone() {
  const navigate = useNavigate()
  const session = useGameStore(s => s.session)

  if (!session) { navigate('/'); return null }
  const i = session.revealIndex
  if (i >= session.players.length) { navigate('/game'); return null }
  const player = session.players[i]
  const total = session.players.length

  return (
    <PhoneScreen padTop={false} padBottom={false}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(70% 50% at 50% 35%, rgba(207, 59, 52, 0.1), transparent 75%)',
      }} />
      <div style={{
        position: 'relative', zIndex: 3,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        padding: '80px 32px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          {Array.from({ length: total }).map((_, k) => (
            <span key={k} style={{
              width: k < i ? 24 : 8, height: 4, borderRadius: 999,
              background: k < i ? 'var(--gold)' : k === i ? 'var(--impostor)' : 'rgba(255,255,255,0.08)',
              boxShadow: k === i ? '0 0 8px var(--impostor)' : 'none',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>
        <div style={{
          textAlign: 'center', marginBottom: 60,
          fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-2)',
          letterSpacing: '0.32em', textTransform: 'uppercase',
        }}>{i + 1} de {total}</div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="t-eyebrow" style={{ marginBottom: 18 }}>Pasa el teléfono a</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: player.name.length > 10 ? 42 : 56,
            color: 'var(--text-1)', letterSpacing: '0.06em',
            textShadow: '0 0 40px rgba(214, 164, 80, 0.3), 0 4px 1px rgba(0,0,0,0.8)',
            lineHeight: 1, padding: '0 20px', wordBreak: 'break-word',
          }}>{player.name.toUpperCase()}</div>

          <div style={{ marginTop: 24, width: 60 }} className="hr-gold-soft" />

          <div style={{
            marginTop: 20,
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13,
            color: 'var(--text-2)', textAlign: 'center', padding: '0 32px',
            lineHeight: 1.5,
          }}>Que nadie más vea tu pantalla.</div>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/game/reveal')} style={{
          padding: '18px 20px', fontSize: 15, letterSpacing: '0.22em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M1 7 C 3 2, 6 0, 9 0 C 12 0, 15 2, 17 7 C 15 12, 12 14, 9 14 C 6 14, 3 12, 1 7 Z"
                  stroke="currentColor" strokeWidth="1.4" fill="none" />
            <circle cx="9" cy="7" r="2.5" fill="currentColor" />
          </svg>
          Ver mi carta
        </button>
      </div>
    </PhoneScreen>
  )
}
