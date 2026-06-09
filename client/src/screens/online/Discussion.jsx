import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
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
  const round = useOnlineStore(s => s.round)
  const lastGuessRound = useOnlineStore(s => s.lastGuessRound)
  const speakOrder = useOnlineStore(s => s.speakOrder)
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

  const orderedPlayers = useMemo(() => {
    const order = speakOrder.length ? speakOrder : players.map(player => player.id)
    return order.map(id => players.find(player => player.id === id)).filter(Boolean)
  }, [players, speakOrder])

  const activeSpeaker = orderedPlayers.find(player => !player.eliminated && !player.disconnected) || orderedPlayers[0]
  const isImpostor = myRole === 'impostor' || myRole === 'impostor-clue'
  const canGuess = isImpostor && (round - lastGuessRound >= 2)
  const guessAvailableAt = lastGuessRound + 2
  const isInterrogationSpeaker = detectiveInterrogation
    ? myId === detectiveInterrogation.detectiveId || myId === detectiveInterrogation.targetId
    : true
  const chatLocked = !!detectiveInterrogation && !isInterrogationSpeaker
  const strategy = strategyForRole(myRole)

  const actions = (
    <DiscussionActions
      isHost={isHost}
      isImpostor={isImpostor}
      canGuess={canGuess}
      guessAvailableAt={guessAvailableAt}
      onGuess={() => setShowGuess(true)}
      onVote={goToVote}
    />
  )
  const chatPanel = (
    <DiscussionChatPanel
      messages={chatMessages}
      myId={myId}
      onSend={sendChatMessage}
      locked={chatLocked}
    />
  )

  return (
    <PhoneScreen
      className="online-discussion-screen"
      leftPanel={
        <DiscussionDossier
          role={myRole}
          word={myWord}
          clue={myClue}
          round={round}
          strategy={strategy}
          canGuess={canGuess}
          guessAvailableAt={guessAvailableAt}
        />
      }
      rightPanel={chatPanel}
      footer={actions}
    >
      <div className="discussion-room">
        <div className="discussion-topbar">
          <div>
            <span className="t-eyebrow">Sala de discusion</span>
            <strong>Ronda {round}</strong>
          </div>
          <Badge color="var(--gold)" dot>{players.length} en mesa</Badge>
        </div>

        <div className="ds-mobile-only">
          <DiscussionDossier
            role={myRole}
            word={myWord}
            clue={myClue}
            round={round}
            strategy={strategy}
            canGuess={canGuess}
            guessAvailableAt={guessAvailableAt}
          />
        </div>

        <section className="discussion-stage">
          <div className="discussion-stage__copy">
            <span className="t-eyebrow">Turno sugerido</span>
            <h1>{activeSpeaker?.name || 'Mesa abierta'}</h1>
            <p>
              Mantengan la conversacion en llamada. Usa el orden como guia y observa quien fuerza detalles.
            </p>
          </div>
          <div className="discussion-speaker-card">
            <Avatar value={activeSpeaker?.avatar} name={activeSpeaker?.name} />
            <div>
              <span>Primera voz</span>
              <strong>{activeSpeaker?.name || 'Sin jugador'}</strong>
              <small>{activeSpeaker?.id === myId ? 'Tu empiezas' : 'Escucha primero'}</small>
            </div>
          </div>
        </section>

        <div className="discussion-interrogation-slot">
          <DetectiveInterrogationPanel
            players={players}
            myId={myId}
            role={myRole}
            interrogation={detectiveInterrogation}
            used={detectiveInterrogationUsed}
            onStart={startDetectiveInterrogation}
          />
        </div>

        <DiscussionTable players={orderedPlayers} myId={myId} />

        <div className="ds-mobile-only">
          {chatPanel}
        </div>
      </div>

      <GuessWordModal open={showGuess} onClose={() => setShowGuess(false)} />
    </PhoneScreen>
  )
}

function DiscussionDossier({ role, word, clue, round, strategy, canGuess, guessAvailableAt }) {
  const meta = roleMeta(role)
  const revealWord = meta.showsWord && word
  const revealClue = role === 'impostor-clue' && clue

  return (
    <aside className={`discussion-dossier discussion-dossier--${meta.tone}`}>
      <div className="case-rail__stamp">Mi expediente</div>
      <div className="discussion-dossier__role">
        <Badge color={meta.color} dot warn={meta.tone === 'red'}>{meta.label}</Badge>
        <span>Ronda {round}</span>
      </div>
      <div className="discussion-dossier__secret">
        <span>{meta.secretLabel}</span>
        <strong>{revealWord ? word.toUpperCase() : meta.secretValue}</strong>
        {revealClue && <small>Pista: {clue}</small>}
      </div>
      <div className="discussion-dossier__strategy">
        <span>Estrategia</span>
        <p>{strategy}</p>
      </div>
      {meta.tone === 'red' && (
        <div className="discussion-dossier__status">
          {canGuess ? 'Adivinanza disponible' : `Adivinar en ronda ${guessAvailableAt}`}
        </div>
      )}
    </aside>
  )
}

function DiscussionChatPanel({ messages, myId, onSend, locked }) {
  return (
    <aside className="discussion-chat-panel">
      <SectionHeader right={`${messages.length}/50`}>Chat en vivo</SectionHeader>
      {locked && (
        <div className="discussion-chat-lock">
          Silencio en la mesa: solo Detective e interrogado pueden escribir.
        </div>
      )}
      <ChatBox messages={messages} myId={myId} onSend={onSend} disabled={locked} />
    </aside>
  )
}

function DiscussionTable({ players, myId }) {
  return (
    <section className="discussion-table">
      <SectionHeader right={`${players.length} jugadores`}>Orden de turno</SectionHeader>
      <div className="discussion-player-grid">
        {players.map((player, index) => {
          const isMe = player.id === myId
          const isFirst = index === 0
          return (
            <article
              key={player.id}
              className={`discussion-player-card ${isMe ? 'is-you' : ''} ${isFirst ? 'is-first' : ''} ${player.eliminated ? 'is-out' : ''}`}
            >
              <span className="discussion-player-card__index">{String(index + 1).padStart(2, '0')}</span>
              <Avatar value={player.avatar} name={player.name} />
              <div className="discussion-player-card__body">
                <strong>{player.name}</strong>
                <span>{player.eliminated ? 'Eliminado' : player.disconnected ? 'Desconectado' : isFirst ? 'Abre la ronda' : 'En escucha'}</span>
              </div>
              {isMe && <span className="discussion-player-card__you">Tu</span>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function DiscussionActions({ isHost, isImpostor, canGuess, guessAvailableAt, onGuess, onVote }) {
  return (
    <div className="discussion-actions">
      {isImpostor && (
        canGuess ? (
          <button type="button" className="discussion-action discussion-action--danger" onClick={onGuess}>
            Adivinar palabra
          </button>
        ) : (
          <div className="discussion-action discussion-action--muted">
            Adivinar disponible en ronda {guessAvailableAt}
          </div>
        )
      )}
      {isHost ? (
        <button type="button" className="btn btn-primary discussion-action--vote" onClick={onVote}>
          Ir a votar
        </button>
      ) : (
        <div className="discussion-action discussion-action--waiting">
          Esperando al anfitrion...
        </div>
      )}
    </div>
  )
}

function Avatar({ value, name }) {
  const display = value || (name || '?').trim().charAt(0).toUpperCase()
  return <span className="discussion-avatar">{display}</span>
}

function roleMeta(role) {
  if (role === 'impostor' || role === 'impostor-clue') {
    return {
      label: 'Impostor',
      color: 'var(--impostor)',
      tone: 'red',
      secretLabel: role === 'impostor-clue' ? 'Pista privada' : 'Palabra',
      secretValue: role === 'impostor-clue' ? 'Tienes una pista' : 'No conoces la palabra',
      showsWord: false,
    }
  }
  if (role === 'detective') {
    return {
      label: 'Detective',
      color: 'var(--gold)',
      tone: 'gold',
      secretLabel: 'Palabra',
      secretValue: 'Investiga sin revelar',
      showsWord: true,
    }
  }
  return {
    label: 'Ciudadano',
    color: 'var(--citizen)',
    tone: 'blue',
    secretLabel: 'Palabra',
    secretValue: 'Sin palabra',
    showsWord: true,
  }
}

function strategyForRole(role) {
  if (role === 'impostor' || role === 'impostor-clue') {
    return 'Escucha primero. Se vago, mezcla detalles y no contradigas demasiado pronto.'
  }
  if (role === 'impostor-blind') {
    return 'Describe lo que crees que es. Si la mesa suena distinta, algo no cuadra.'
  }
  if (role === 'detective') {
    return 'Presiona con calma. El interrogatorio no da veredicto, pero ordena la conversacion.'
  }
  return 'Describe la palabra sin decirla. Observa quien improvisa o evita detalles concretos.'
}
