import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import CompactRoleReminder from '../../components/CompactRoleReminder.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import GuessWordModal from '../../components/GuessWordModal.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function Discussion() {
  const navigate = useNavigate()
  const isHost = useOnlineStore(s => s.isHost)
  const myRole = useOnlineStore(s => s.myRole)
  const myWord = useOnlineStore(s => s.myWord)
  const myClue = useOnlineStore(s => s.myClue)
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const goToVote = useOnlineStore(s => s.goToVote)
  const round = useOnlineStore(s => s.round)
  const lastGuessRound = useOnlineStore(s => s.lastGuessRound)
  const speakOrder = useOnlineStore(s => s.speakOrder)
  const myId = useOnlineStore(s => s.myId)
  const [showGuess, setShowGuess] = useState(false)

  useEffect(() => {
    if (phase === 'voting') navigate('/online/vote')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  const isImpostor = myRole === 'impostor' || myRole === 'impostor-clue'
  const canGuess = isImpostor && (round - lastGuessRound >= 2)
  const guessAvailableAt = lastGuessRound + 2

  return (
    <PhoneScreen
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isImpostor && (
            canGuess ? (
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
            ) : (
              <div style={{
                padding: '13px 18px', borderRadius: 12, textAlign: 'center',
                border: '1px solid rgba(255, 64, 80, 0.2)',
                background: 'rgba(255, 64, 80, 0.05)',
                fontFamily: 'var(--font-ui)', fontSize: 11,
                color: 'var(--text-3)', letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>
                Adivinar disponible en ronda {guessAvailableAt}
              </div>
            )
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
            ) : (
              <>Describe la palabra <strong style={{ color: 'var(--citizen)', fontStyle: 'normal' }}>sin decirla</strong>. Observa quién improvisa demasiado.</>
            )}
          </div>

          <SectionHeader>Orden de turno</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {(speakOrder.length ? speakOrder : players.map(p => p.id)).map((id, idx) => {
              const player = players.find(p => p.id === id)
              if (!player) return null
              const isMe = id === myId
              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px',
                  background: isMe ? 'rgba(100,210,255,0.07)' : 'var(--surface-1)',
                  border: `1px solid ${isMe ? 'rgba(100,210,255,0.28)' : 'var(--hairline-cold)'}`,
                  borderRadius: 10,
                  opacity: player.eliminated ? 0.32 : 1,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-num)', fontSize: 13,
                    color: 'var(--text-3)', minWidth: 18,
                  }}>{idx + 1}</span>
                  <span style={{
                    fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-1)',
                    textDecoration: player.eliminated ? 'line-through' : 'none', flex: 1,
                  }}>{player.name}</span>
                  {isMe && (
                    <span style={{
                      fontFamily: 'var(--font-ui)', fontSize: 10,
                      color: 'var(--citizen)', letterSpacing: '0.18em',
                    }}>TÚ</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <GuessWordModal open={showGuess} onClose={() => setShowGuess(false)} />
    </PhoneScreen>
  )
}
