import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import BackgroundSilhouettes from '../../components/BackgroundSilhouettes.jsx'
import PrefsToggle from '../../components/PrefsToggle.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { sfx } from '../../utils/sfx.js'

export default function Home() {
  const navigate = useNavigate()
  const hasSavedGame = useGameStore(s => s.hasSavedGame())
  const endSession = useGameStore(s => s.endSession)

  const onNew = () => { sfx.unlock(); endSession(); navigate('/setup') }
  const onResume = () => { sfx.unlock(); navigate('/game') }
  const onHow = () => navigate('/how')
  const onHost = () => { sfx.unlock(); navigate('/online/host') }
  const onJoin = () => { sfx.unlock(); navigate('/online/join') }

  return (
    <PhoneScreen padTop={false} padBottom={false}>
      <BackgroundSilhouettes />
      <div style={{
        position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: 18, zIndex: 6,
      }}>
        <PrefsToggle />
      </div>
      <div style={{
        position: 'relative', zIndex: 4, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        padding: '90px 32px 40px',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="t-eyebrow" style={{ marginBottom: 14, fontSize: 10 }}>UN JUEGO DE</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 56, letterSpacing: '0.04em', lineHeight: 0.95,
            color: 'var(--text-1)', textAlign: 'center',
            textShadow: `
              0 0 60px rgba(220, 38, 38, 0.55),
              0 0 24px rgba(220, 38, 38, 0.35),
              0 2px 1px rgba(0,0,0,0.8)
            `,
            animation: 'redPulse 3.6s ease-in-out infinite',
          }}>EL<br />IMPOSTOR</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
            <span style={{ width: 30, height: 1, background: 'var(--gold)' }} />
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M6 1 L 8 5 L 11 6 L 8 7 L 6 11 L 4 7 L 1 6 L 4 5 Z" fill="var(--gold)" />
            </svg>
            <span style={{ width: 30, height: 1, background: 'var(--gold)' }} />
          </div>

          <div style={{
            marginTop: 20, fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--text-2)', textAlign: 'center', letterSpacing: '0.04em',
          }}>¿Puedes confiar en alguien?</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" onClick={onNew}>Nueva partida</button>

          {hasSavedGame && (
            <button className="btn btn-secondary" onClick={onResume}>Reanudar partida</button>
          )}

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: 12, borderRadius: 14,
            background: 'rgba(245, 158, 11, 0.025)',
            border: '1px solid rgba(245, 158, 11, 0.22)',
            position: 'relative', marginTop: 4,
          }}>
            <div style={{
              position: 'absolute', top: -8, left: 14,
              padding: '0 8px', background: 'var(--bg-base)',
              fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.32em', color: 'var(--gold)', textTransform: 'uppercase',
            }}>● Online</div>
            <button onClick={onHost} style={{
              all: 'unset', cursor: 'pointer', width: '100%',
              padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
              color: 'var(--gold)', textAlign: 'center',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>Crear sala</button>
            <button onClick={onJoin} style={{
              all: 'unset', cursor: 'pointer', width: '100%',
              padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
              background: 'transparent',
              border: '1px solid var(--hairline-cold)',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
              color: 'var(--text-1)', textAlign: 'center',
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>Unirme con código</button>
          </div>

          <button className="btn btn-ghost" onClick={onHow}>Cómo jugar</button>
        </div>

        <div style={{
          textAlign: 'center', marginTop: 20,
          fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.32em',
          color: 'var(--text-faint)', textTransform: 'uppercase',
        }}>v1.0 · 3–12 jugadores</div>
      </div>
    </PhoneScreen>
  )
}
