import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import ConnectedPlayer from '../../components/ConnectedPlayer.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import Badge from '../../components/Badge.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function WaitingLobby() {
  const navigate = useNavigate()
  const roomCode = useOnlineStore(s => s.roomCode)
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const myId = useOnlineStore(s => s.myId)
  const leaveRoom = useOnlineStore(s => s.leaveRoom)

  useEffect(() => {
    if (!roomCode) navigate('/')
  }, [roomCode, navigate])
  useEffect(() => {
    if (phase === 'reveal') navigate('/online/card')
  }, [phase, navigate])

  return (
    <PhoneScreen>
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => { leaveRoom(); navigate('/') }} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13,
        }}>← Salir</button>
        <Badge color="var(--gold)">{roomCode}</Badge>
      </div>

      <div style={{ padding: '40px 24px 0', textAlign: 'center' }}>
        <div style={{
          width: 16, height: 16, borderRadius: 999, margin: '0 auto 18px',
          background: 'var(--gold)',
          boxShadow: '0 0 16px var(--gold)',
          animation: 'pulseGlow 1.6s ease-in-out infinite',
        }} />
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
          color: 'var(--text-1)', letterSpacing: '0.04em', marginBottom: 6,
        }}>Esperando al anfitrión…</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: 13,
          color: 'var(--text-2)',
        }}>La partida iniciará cuando el anfitrión esté listo.</div>
      </div>

      <div style={{ padding: '40px 20px 0' }}>
        <SectionHeader>En la sala</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map(p => (
            <ConnectedPlayer
              key={p.id}
              name={p.name}
              isHost={p.isHost}
              isYou={p.id === myId}
              status="ready"
            />
          ))}
        </div>
      </div>
    </PhoneScreen>
  )
}
