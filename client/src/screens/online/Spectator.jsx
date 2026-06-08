import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import PlayerChip from '../../components/PlayerChip.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function Spectator() {
  const navigate = useNavigate()
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const myWord = useOnlineStore(s => s.myWord)
  const myRole = useOnlineStore(s => s.myRole)

  useEffect(() => {
    if (phase === 'ended') navigate('/online/end')
  }, [phase, navigate])

  return (
    <PhoneScreen>
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="t-eyebrow">Espectador</span>
        <Badge color="var(--impostor)" warn>HAS SIDO ELIMINADO</Badge>
      </div>

      <div style={{ padding: '40px 24px 24px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
          color: 'var(--text-1)', letterSpacing: '0.06em', marginBottom: 8,
          textShadow: '0 0 20px var(--impostor-glow)',
        }}>FUERA DE LA MESA</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: 13,
          color: 'var(--text-2)', lineHeight: 1.5,
        }}>Observa cómo termina la partida. Ya no puedes votar.</div>
        {myWord && (myRole === 'citizen' || myRole === 'detective') && (
          <div style={{
            marginTop: 24, padding: '16px',
            border: '1px solid var(--hairline-cold)',
            borderRadius: 14, background: 'var(--surface-1)',
          }}>
            <div className="t-eyebrow" style={{ marginBottom: 6 }}>Tu palabra era</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24,
              color: 'var(--citizen)', letterSpacing: '0.06em',
            }}>{myWord.toUpperCase()}</div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        <SectionHeader>Jugadores activos</SectionHeader>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {players.map(p => (
            <PlayerChip key={p.id} name={p.name} avatar={p.avatar} eliminated={p.eliminated} />
          ))}
        </div>
      </div>
    </PhoneScreen>
  )
}
