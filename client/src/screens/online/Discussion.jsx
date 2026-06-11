import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import ChatBox from '../../components/ChatBox.jsx'
import AlibiMap from '../../components/AlibiMap.jsx'
import DetectiveInterrogationPanel from '../../components/DetectiveInterrogationPanel.jsx'
import GuessWordModal from '../../components/GuessWordModal.jsx'
import VoicePanel from '../../components/VoicePanel.jsx'
import PlayerAvatar from '../../components/PlayerAvatar.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { isAlibiGame } from '../../utils/gameTypes.js'
import { canGuessWordRole, isDetectiveRole } from '../../utils/roles.js'

export default function Discussion() {
  const navigate = useNavigate()
  const isHost = useOnlineStore(s => s.isHost)
  const myRole = useOnlineStore(s => s.myRole)
  const myWord = useOnlineStore(s => s.myWord)
  const myClue = useOnlineStore(s => s.myClue)
  const myAlibi = useOnlineStore(s => s.myAlibi)
  const alibiCase = useOnlineStore(s => s.alibiCase)
  const myImpostorTeammates = useOnlineStore(s => s.myImpostorTeammates)
  const config = useOnlineStore(s => s.config)
  const myId = useOnlineStore(s => s.myId)
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const goToVote = useOnlineStore(s => s.goToVote)
  const round = useOnlineStore(s => s.round)
  const lastGuessRound = useOnlineStore(s => s.lastGuessRound)
  const impostorLastGuessRound = useOnlineStore(s => s.impostorLastGuessRound)
  const speakOrder = useOnlineStore(s => s.speakOrder)
  const chatMessages = useOnlineStore(s => s.chatMessages)
  const impostorChatMessages = useOnlineStore(s => s.impostorChatMessages)
  const sendChatMessage = useOnlineStore(s => s.sendChatMessage)
  const sendImpostorChatMessage = useOnlineStore(s => s.sendImpostorChatMessage)
  const detectiveInterrogation = useOnlineStore(s => s.detectiveInterrogation)
  const detectiveInterrogationUsed = useOnlineStore(s => s.detectiveInterrogationUsed)
  const startDetectiveInterrogation = useOnlineStore(s => s.startDetectiveInterrogation)
  const [showGuess, setShowGuess] = useState(false)

  useEffect(() => {
    if (phase === 'caseIntro') navigate('/online/alibi-case')
    if (phase === 'voting') navigate('/online/vote')
    if (phase === 'roundResult') navigate('/online/alibi-result')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  const orderedPlayers = useMemo(() => {
    const order = speakOrder.length ? speakOrder : players.map(player => player.id)
    return order.map(id => players.find(player => player.id === id)).filter(Boolean)
  }, [players, speakOrder])

  const activeSpeaker = orderedPlayers.find(player => !player.eliminated && !player.disconnected) || orderedPlayers[0]
  const me = players.find(player => player.id === myId)
  const isActivePlayer = me ? !me.eliminated && !me.disconnected : false
  const isImpostor = canGuessWordRole(myRole)
  const teamLastGuessRound = Number.isFinite(impostorLastGuessRound) ? impostorLastGuessRound : lastGuessRound
  const canGuess = isImpostor && isActivePlayer && (round - teamLastGuessRound >= 2)
  const guessAvailableAt = teamLastGuessRound + 2
  const isInterrogationSpeaker = detectiveInterrogation
    ? myId === detectiveInterrogation.detectiveId || myId === detectiveInterrogation.targetId
    : true
  const chatLocked = !!detectiveInterrogation && !isInterrogationSpeaker
  const strategy = strategyForRole(myRole)

  if (isAlibiGame(config)) {
    return (
      <AlibiDiscussion
        isHost={isHost}
        myId={myId}
        myAlibi={myAlibi}
        alibiCase={alibiCase}
        players={players}
        round={round}
        chatMessages={chatMessages}
        sendChatMessage={sendChatMessage}
        myRole={myRole}
        interrogation={detectiveInterrogation}
        interrogationUsed={detectiveInterrogationUsed}
        onInterrogate={startDetectiveInterrogation}
        onVote={goToVote}
      />
    )
  }

  const actions = (
    <DiscussionActions
      isHost={isHost}
      isActivePlayer={isActivePlayer}
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
      impostorMessages={impostorChatMessages}
      myId={myId}
      onSend={sendChatMessage}
      onSendImpostor={sendImpostorChatMessage}
      locked={chatLocked}
      impostorLocked={!!detectiveInterrogation}
      canUseImpostorChat={isImpostor && isActivePlayer}
    />
  )

  return (
    <PhoneScreen
      className="online-discussion-screen"
      leftPanel={
        <div className="discussion-side-stack">
          <DiscussionDossier
            role={myRole}
            word={myWord}
            clue={myClue}
            impostorTeammates={myImpostorTeammates}
            round={round}
            strategy={strategy}
            canGuess={canGuess}
            guessAvailableAt={guessAvailableAt}
          />
          <VoicePanel compact />
        </div>
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
            impostorTeammates={myImpostorTeammates}
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

        <div className="ds-mobile-only">
          <VoicePanel compact />
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

function AlibiDiscussion({
  myId,
  myAlibi,
  alibiCase,
  players,
  round,
  chatMessages,
  sendChatMessage,
  myRole,
  interrogation,
  interrogationUsed,
  onInterrogate,
  onVote,
}) {
  const caseInfo = alibiCase || myAlibi || {}
  const totalRounds = caseInfo.totalRounds || 3
  const isDetective = isDetectiveRole(myRole) || myAlibi?.role === 'alibi-detective'
  const detective = caseInfo.detective || myAlibi?.detective || null
  const activePlayers = players.filter(player => !player.disconnected)
  const activeSuspects = activePlayers.filter(player => player.id !== detective?.id)
  const evidence = Array.isArray(caseInfo.publicEvidence) ? caseInfo.publicEvidence : []
  const questions = Array.isArray(caseInfo.tableQuestions) ? caseInfo.tableQuestions : []
  const primaryEvidence = caseInfo.evidence || evidence[0] || 'Las versiones de la mesa no encajan del todo.'
  const objective = caseInfo.objective || 'Encuentren quien sostiene una coartada falsa.'
  const chatPanel = (
    <aside className="discussion-chat-panel">
      <SectionHeader right={`${chatMessages.length}/50`}>Mesa</SectionHeader>
      <ChatBox
        messages={chatMessages}
        myId={myId}
        onSend={sendChatMessage}
        maxLength={80}
        placeholder="Comparte una pista"
        emptyText="La mesa aun no ha cruzado versiones."
        tone="public"
      />
    </aside>
  )

  return (
    <PhoneScreen
      className={`online-discussion-screen alibi-discussion-screen ${isDetective ? 'is-detective' : ''}`}
      leftPanel={
        <div className="discussion-side-stack">
          {isDetective ? (
            <AlibiDetectiveDossier myAlibi={myAlibi} round={round} totalRounds={totalRounds} />
          ) : (
            <AlibiPrivateDossier myAlibi={myAlibi} round={round} totalRounds={totalRounds} />
          )}
          <VoicePanel compact />
        </div>
      }
      rightPanel={chatPanel}
      footer={
        <div className="discussion-actions">
          {isDetective ? (
            <button type="button" className="btn btn-primary discussion-action--vote" onClick={onVote}>
              Emitir acusacion
            </button>
          ) : (
            <div className="discussion-action discussion-action--waiting">
              Esperando la acusacion del detective...
            </div>
          )}
        </div>
      }
    >
      <div className="discussion-room alibi-discussion-room">
        <div className="discussion-topbar alibi-discussion-topbar">
          <div>
            <span className="t-eyebrow">Modo Coartada</span>
            <strong>Ronda {round}/{totalRounds}</strong>
          </div>
          <Badge color="var(--gold)" dot>{activeSuspects.length} sospechosos</Badge>
        </div>

        <div className="ds-mobile-only">
          {isDetective ? (
            <AlibiDetectiveDossier myAlibi={myAlibi} round={round} totalRounds={totalRounds} compact />
          ) : (
            <AlibiPrivateDossier myAlibi={myAlibi} round={round} totalRounds={totalRounds} compact />
          )}
        </div>

        <section className="alibi-command-panel">
          <div>
            <span className="t-eyebrow">Expediente abierto</span>
            <h1>{caseInfo.title || 'Coartada cruzada'}</h1>
            <p>{caseInfo.brief || 'La mesa debe encontrar quien esta defendiendo una version falsa.'}</p>
          </div>
          <aside className="alibi-command-panel__objective">
            <span>Objetivo</span>
            <strong>{objective}</strong>
            <small>{caseInfo.roundPrompt || 'Pregunten por rutas, sonidos y detalles concretos.'}</small>
          </aside>
        </section>

        {(isDetective || interrogation) && (
          <section className="alibi-detective-workbench">
            <div className="alibi-detective-workbench__brief">
              <span className="t-eyebrow">Panel del detective</span>
              <strong>{isDetective ? 'Tú decides a quién acusar.' : `${detective?.name || 'El Detective'} dirige la investigación.`}</strong>
              <p>
                {isDetective
                  ? 'Elige un sospechoso para interrogar en privado y usa la acusación final cuando tengas una contradicción clara.'
                  : 'Responde con tu versión y observa qué preguntas hace el Detective.'}
              </p>
            </div>
            <DetectiveInterrogationPanel
              players={activeSuspects}
              myId={myId}
              role={myRole}
              interrogation={interrogation}
              used={interrogationUsed}
              onStart={onInterrogate}
            />
          </section>
        )}

        <section className="alibi-public-board">
          <article className="alibi-public-evidence">
            <span className="t-eyebrow">Evidencia clave</span>
            <strong>{primaryEvidence}</strong>
            {evidence.length > 1 && (
              <ul>
                {evidence.slice(1, 4).map(item => <li key={item}>{item}</li>)}
              </ul>
            )}
          </article>

          <article className="alibi-question-card">
            <span className="t-eyebrow">Para interrogar</span>
            <div>
              {(questions.length ? questions : [
                '¿Qué podías ver desde tu ubicación?',
                '¿Qué escuchaste durante el apagón?',
                '¿Quién podía cruzar más rápido?',
              ]).slice(0, 4).map((question, index) => (
                <p key={question}><b>{index + 1}</b>{question}</p>
              ))}
            </div>
          </article>
        </section>

        <section className="alibi-investigation-layout">
          <AlibiMap map={caseInfo.map} highlight={myAlibi?.claimedLocation} compact />

          <aside className="alibi-table-guide">
            <span className="t-eyebrow">Como ganar la discusion</span>
            <strong>Busca una version que no sobreviva al mapa.</strong>
            <p>
              Pide detalles de vision, sonido y ruta. Si alguien explica demasiado, cambia su orden o evita una zona clave, la mesa tiene una acusacion.
            </p>
            <div className="alibi-table-guide__chips">
              <span>Vista</span>
              <span>Sonido</span>
              <span>Ruta</span>
              <span>Tiempo</span>
            </div>
          </aside>
        </section>

        <section className="discussion-table alibi-suspects-panel">
          <SectionHeader right={`${activeSuspects.length} jugadores`}>Sospechosos</SectionHeader>
          <div className="discussion-player-grid">
            {activeSuspects.map((player, index) => (
              <article
                key={player.id}
                className={`discussion-player-card ${player.id === myId ? 'is-you' : ''}`}
              >
                <span className="discussion-player-card__index">{String(index + 1).padStart(2, '0')}</span>
                <Avatar value={player.avatar} name={player.name} />
                <div className="discussion-player-card__body">
                  <strong>{player.name}</strong>
                  <span>{player.id === myId ? 'Tu version' : 'Coartada por comprobar'}</span>
                </div>
                {player.id === myId && <span className="discussion-player-card__you">Tu</span>}
              </article>
            ))}
          </div>
        </section>

        <div className="ds-mobile-only">
          <VoicePanel compact />
          {chatPanel}
        </div>
      </div>
    </PhoneScreen>
  )
}

function AlibiDetectiveDossier({ myAlibi, round, totalRounds, compact = false }) {
  const suspects = Array.isArray(myAlibi?.suspects) ? myAlibi.suspects : []

  return (
    <aside className={`discussion-dossier alibi-dossier alibi-dossier--detective ${compact ? 'alibi-dossier--compact' : ''}`}>
      <div className="case-rail__stamp">Detective</div>
      <div className="discussion-dossier__role">
        <Badge color="var(--citizen)" dot>Director del caso</Badge>
        <span>Ronda {round}/{totalRounds}</span>
      </div>
      <div className="discussion-dossier__secret">
        <span>Tu objetivo</span>
        <strong>ACUSAR LA COARTADA FALSA</strong>
        <small>{suspects.length} sospechosos bajo investigacion.</small>
      </div>
      <div className="discussion-dossier__strategy">
        <span>Metodo</span>
        <p>{myAlibi?.statement || 'Escucha cada version y cruza mapa, sonidos y evidencia.'}</p>
      </div>
      <div className="discussion-dossier__strategy">
        <span>Pista del caso</span>
        <p>{myAlibi?.clue || 'La mentira suele fallar en una ruta, un sonido o un detalle de visibilidad.'}</p>
      </div>
    </aside>
  )
}

function AlibiPrivateDossier({ myAlibi, round, totalRounds, compact = false }) {
  const isLiar = myAlibi?.role === 'alibi-liar'

  return (
    <aside className={`discussion-dossier alibi-dossier ${isLiar ? 'discussion-dossier--red' : 'discussion-dossier--gold'} ${compact ? 'alibi-dossier--compact' : ''}`}>
      <div className="case-rail__stamp">Mi coartada</div>
      <div className="discussion-dossier__role">
        <Badge color={isLiar ? 'var(--impostor)' : 'var(--gold)'} dot warn={isLiar}>
          {isLiar ? 'Coartada falsa' : 'Testigo'}
        </Badge>
        <span>Ronda {round}/{totalRounds}</span>
      </div>
      <div className="discussion-dossier__secret">
        <span>{isLiar ? 'Debes decir' : 'Ubicacion'}</span>
        <strong>{(myAlibi?.claimedLocation || 'Sin lugar').toUpperCase()}</strong>
        {isLiar && myAlibi?.realLocation && <small>Real: {myAlibi.realLocation}</small>}
      </div>
      <div className="discussion-dossier__strategy">
        <span>Tu version</span>
        <p>{myAlibi?.statement || 'Defiende tu coartada sin regalar informacion.'}</p>
      </div>
      {(myAlibi?.saw || myAlibi?.heard || myAlibi?.detail) && (
        <div className="discussion-dossier__strategy alibi-dossier__facts">
          {myAlibi?.saw && <p><span>Viste</span>{myAlibi.saw}</p>}
          {myAlibi?.heard && <p><span>Oiste</span>{myAlibi.heard}</p>}
          {myAlibi?.detail && <p><span>Detalle</span>{myAlibi.detail}</p>}
        </div>
      )}
      <div className="discussion-dossier__strategy">
        <span>{isLiar ? 'Consejo' : 'Pista privada'}</span>
        <p>{myAlibi?.clue || 'Escucha contradicciones antes de acusar.'}</p>
      </div>
      {myAlibi?.risk && (
        <div className="discussion-dossier__status">
          Riesgo: {myAlibi.risk}
        </div>
      )}
    </aside>
  )
}

function DiscussionDossier({ role, word, clue, impostorTeammates = [], round, strategy, canGuess, guessAvailableAt }) {
  const meta = roleMeta(role)
  const revealWord = (meta.showsWord && word) || (role === 'detective-impostor' && word)
  const revealClue = (role === 'impostor-clue' || role === 'detective-impostor') && clue
  const hasImpostorTeammates = impostorTeammates.length > 0

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
      {hasImpostorTeammates && (
        <div className="discussion-dossier__team">
          <span>Equipo impostor</span>
          <div>
            {impostorTeammates.map(teammate => (
              <strong key={teammate.id}>
                <PlayerAvatar avatar={teammate.avatar} name={teammate.name} className="dossier-team-avatar" />
                {teammate.name}
              </strong>
            ))}
          </div>
        </div>
      )}
      {meta.tone === 'red' && (
        <div className="discussion-dossier__status">
          {canGuess ? 'Adivinanza disponible' : `Adivinar en ronda ${guessAvailableAt}`}
        </div>
      )}
    </aside>
  )
}

function DiscussionChatPanel({
  messages,
  impostorMessages,
  myId,
  onSend,
  onSendImpostor,
  locked,
  impostorLocked,
  canUseImpostorChat,
}) {
  const [activeTab, setActiveTab] = useState('public')
  const privateActive = canUseImpostorChat && activeTab === 'impostor'
  const visibleMessages = privateActive ? impostorMessages : messages
  const visibleCount = visibleMessages.length

  return (
    <aside className="discussion-chat-panel">
      <SectionHeader right={`${visibleCount}/50`}>Chat en vivo</SectionHeader>
      {canUseImpostorChat && (
        <div className="discussion-chat-tabs" role="tablist" aria-label="Canales de chat">
          <button
            type="button"
            className={!privateActive ? 'is-active' : ''}
            onClick={() => setActiveTab('public')}
          >
            Mesa
          </button>
          <button
            type="button"
            className={privateActive ? 'is-active' : ''}
            onClick={() => setActiveTab('impostor')}
          >
            Impostores
          </button>
        </div>
      )}
      {!privateActive && locked && (
        <div className="discussion-chat-lock">
          Silencio en la mesa: solo Detective e interrogado pueden escribir.
        </div>
      )}
      {privateActive && impostorLocked && (
        <div className="discussion-chat-lock discussion-chat-lock--impostor">
          Canal impostor pausado durante el interrogatorio.
        </div>
      )}
      <ChatBox
        key={privateActive ? 'impostor' : 'public'}
        messages={visibleMessages}
        myId={myId}
        onSend={privateActive ? onSendImpostor : onSend}
        disabled={privateActive ? impostorLocked : locked}
        maxLength={privateActive ? 80 : 20}
        placeholder={privateActive ? 'Mensaje privado' : 'Mensaje'}
        emptyText={privateActive ? 'Sin mensajes del equipo impostor.' : 'Todavia no hay mensajes.'}
        tone={privateActive ? 'impostor' : 'public'}
      />
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

function DiscussionActions({ isHost, isActivePlayer, isImpostor, canGuess, guessAvailableAt, onGuess, onVote }) {
  if (!isActivePlayer) {
    return (
      <div className="discussion-actions">
        <div className="discussion-action discussion-action--waiting">
          Estas eliminado. Espera el resultado de la mesa.
        </div>
      </div>
    )
  }

  return (
    <div className="discussion-actions">
      {isImpostor && (
        canGuess ? (
          <button type="button" className="discussion-action discussion-action--danger" onClick={onGuess}>
            Adivinar palabra
          </button>
        ) : (
          <div className="discussion-action discussion-action--muted">
            Equipo puede adivinar en ronda {guessAvailableAt}
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
  return <PlayerAvatar avatar={value} name={name} className="discussion-avatar" />
}

function roleMeta(role) {
  if (role === 'detective-impostor') {
    return {
      label: 'Detective Impostor',
      color: 'var(--gold)',
      tone: 'red',
      secretLabel: 'Coartada',
      secretValue: 'Investiga para desviar',
      showsWord: false,
    }
  }
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
  if (role === 'detective' || role === 'detective-blind') {
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
  if (role === 'detective-impostor') {
    return 'Usa el interrogatorio para dirigir sospechas. Sigues jugando para los impostores.'
  }
  if (role === 'impostor' || role === 'impostor-clue') {
    return 'Escucha primero. Se vago, mezcla detalles y no contradigas demasiado pronto.'
  }
  if (role === 'impostor-blind') {
    return 'Describe lo que crees que es. Si la mesa suena distinta, algo no cuadra.'
  }
  if (role === 'detective' || role === 'detective-blind') {
    return 'Presiona con calma. El interrogatorio no da veredicto, pero ordena la conversacion.'
  }
  return 'Describe la palabra sin decirla. Observa quien improvisa o evita detalles concretos.'
}
