import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import CompactRoleReminder from '../../components/CompactRoleReminder.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import PlayerChip from '../../components/PlayerChip.jsx'
import ChatBox from '../../components/ChatBox.jsx'
import DetectiveInterrogationPanel from '../../components/DetectiveInterrogationPanel.jsx'
import GuessWordModal from '../../components/GuessWordModal.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function Discussion() {
  const navigate = useNavigate()
  const isHost = useOnlineStore(s => s.isHost)
  const myRole = useOnlineStore(s => s.myRole)
  const myWord = useOnlineStore(s => s.myWord)
  const myClue = useOnlineStore(s => s.myClue)
  const myId = useOnlineStore(s => s.myId)
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const goToVote = useOnlineStore(s => s.goToVote)
  const chatMessages = useOnlineStore(s => s.chatMessages)
  const sendChatMessage = useOnlineStore(s => s.sendChatMessage)
  const detectiveInterrogation = useOnlineStore(s => s.detectiveInterrogation)
  const detectiveInterrogationUsed = useOnlineStore(s => s.detectiveInterrogationUsed)
  const startDetectiveInterrogation = useOnlineStore(s => s.startDetectiveInterrogation)
  const [showGuess, setShowGuess] = useState(false)

  useEffect(() => {
    if (phase === 'voting') navigate('/online/vote')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  const isImpostor = myRole === 'impostor' || myRole === 'impostor-clue' || myRole === 'impostor-blind'

  return (
    <PhoneScreen
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isImpostor && (
            <button
              onClick={() => setShowGuess(true)}
              style={{
                padding: '13px 18px',
                background: 'linear-gradient(180deg, rgba(217, 38, 56, 0.18) 0%, rgba(120, 18, 30, 0.22) 100%)',
                border: '1px solid rgba(255, 64, 80, 0.55)',
                borderRadius: 12,
                color: 'var(--impostor)',
                fontFamily: 'var(--font-ui)', fontWeight: 600,
                fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Adivinar palabra
            </button>
          )}
          {isHost ? (
            <button className="btn btn-primary" onClick={goToVote}
              style={{ padding: '18px 20px', letterSpacing: '0.2em' }}>
              Ir a votar
            </button>
          ) : (
            <div style={{
              textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12,
              color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase',
              paddingBottom: 4,
            }}>Esperando al anfitrión…</div>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 20px' }}>
        <CompactRoleReminder role={myRole} word={myWord} clue={myClue} />

        <div style={{ padding: '20px 0 0' }}>
          <SectionHeader>Estrategia</SectionHeader>
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline-cold)',
            borderRadius: 14, padding: '14px 16px',
            fontFamily: 'var(--font-ui)', fontSize: 13, lineHeight: 1.5,
            color: 'var(--text-2)', fontStyle: 'italic', marginBottom: 24,
          }}>
            {myRole === 'impostor' || myRole === 'impostor-clue' ? (
              <>Escucha primero. Sé vago, mezcla detalles. <strong style={{ color: 'var(--impostor)', fontStyle: 'normal' }}>No te delates.</strong></>
            ) : myRole === 'impostor-blind' ? (
              <>Describe lo que crees que es. Si los demás suenan distinto… algo no cuadra.</>
            ) : myRole === 'detective' ? (
              <>Elige bien a quien presionar. El interrogatorio no da veredicto, pero ordena la conversacion.</>
            ) : (
              <>Describe la palabra <strong style={{ color: 'var(--citizen)', fontStyle: 'normal' }}>sin decirla</strong>. Observa quién improvisa demasiado.</>
            )}
          </div>

          <DetectiveInterrogationPanel
            players={players}
            myId={myId}
            role={myRole}
            interrogation={detectiveInterrogation}
            used={detectiveInterrogationUsed}
            onStart={startDetectiveInterrogation}
          />

          <SectionHeader>En la mesa</SectionHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {players.map(p => (
              <PlayerChip
                key={p.id}
                name={p.name}
                avatar={p.avatar}
                eliminated={p.eliminated}
                disconnected={p.disconnected}
              />
            ))}
          </div>

          <SectionHeader right={`${chatMessages.length}/50`}>Chat</SectionHeader>
          <ChatBox messages={chatMessages} myId={myId} onSend={sendChatMessage} />
        </div>
      </div>

      <GuessWordModal open={showGuess} onClose={() => setShowGuess(false)} />
    </PhoneScreen>
  )
}
