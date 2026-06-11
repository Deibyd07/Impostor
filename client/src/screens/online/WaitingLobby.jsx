import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import CornerOrnament from '../../components/CornerOrnament.jsx'
import { LobbyPlayersBoard, LobbyStatusPanel } from '../../components/OnlineLobbyPanels.jsx'
import VoicePanel from '../../components/VoicePanel.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function WaitingLobby() {
  const navigate = useNavigate()
  const roomCode = useOnlineStore(s => s.roomCode)
  const players = useOnlineStore(s => s.players)
  const config = useOnlineStore(s => s.config)
  const phase = useOnlineStore(s => s.phase)
  const isHost = useOnlineStore(s => s.isHost)
  const myId = useOnlineStore(s => s.myId)
  const leaveRoom = useOnlineStore(s => s.leaveRoom)
  const visibleCode = roomCode || '----'

  useEffect(() => {
    if (!roomCode) navigate('/')
  }, [roomCode, navigate])
  useEffect(() => {
    if (phase === 'reveal') navigate('/online/card')
  }, [phase, navigate])
  useEffect(() => {
    if (roomCode && isHost && phase === 'lobby') navigate('/online/host')
  }, [roomCode, isHost, phase, navigate])

  return (
    <PhoneScreen
      className="online-lobby-screen online-lobby-waiting-screen"
      rightPanel={
        <div className="lobby-desktop-side-stack">
          <LobbyStatusPanel
            players={players}
            config={config}
            note="El anfitrion esta preparando el expediente. Cuando inicie, cada jugador recibe su carta privada."
          />
          <VoicePanel compact />
        </div>
      }
    >
      <div className="lobby-room lobby-room--waiting">
        <div className="lobby-room__nav">
          <button onClick={() => { leaveRoom(); navigate('/') }}>← Salir</button>
          <Badge color="var(--citizen)" dot>{visibleCode}</Badge>
        </div>

        <section className="lobby-command lobby-command--waiting">
          <CornerOrnament color="rgba(125, 180, 204, 0.4)" />
          <div className="lobby-command__copy">
            <div className="t-eyebrow">Sala privada</div>
            <h1>Mesa en espera</h1>
            <p>El anfitrion ajusta el expediente. Mantente en la mesa hasta que se repartan las cartas.</p>
          </div>
          <div className="lobby-waiting-pulse" aria-label={`Codigo de sala ${visibleCode}`}>
            <span />
            <strong>{visibleCode}</strong>
            <small>codigo activo</small>
          </div>
        </section>

        <div className="ds-mobile-only">
          <LobbyStatusPanel
            players={players}
            config={config}
            note="El anfitrion esta preparando el expediente. Cuando inicie, cada jugador recibe su carta privada."
          />
        </div>

        <div className="ds-mobile-only">
          <VoicePanel />
        </div>

        <LobbyPlayersBoard players={players} myId={myId} />
      </div>
    </PhoneScreen>
  )
}
