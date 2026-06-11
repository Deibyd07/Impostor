import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import PlayerAvatar from '../../components/PlayerAvatar.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { useVoiceStore } from '../../store/voiceStore.js'
import { sfx } from '../../utils/sfx.js'

export default function PartyLineRound() {
  const navigate = useNavigate()
  const phase = useOnlineStore(s => s.phase)
  const myId = useOnlineStore(s => s.myId)
  const players = useOnlineStore(s => s.players)
  const partyLineRound = useOnlineStore(s => s.partyLineRound)
  const myPartyLine = useOnlineStore(s => s.myPartyLine)
  const partyLineCalls = useOnlineStore(s => s.partyLineCalls)
  const submitPartyLineAction = useOnlineStore(s => s.submitPartyLineAction)
  const requestPartyLineCall = useOnlineStore(s => s.requestPartyLineCall)
  const acceptPartyLineCall = useOnlineStore(s => s.acceptPartyLineCall)
  const declinePartyLineCall = useOnlineStore(s => s.declinePartyLineCall)
  const cancelPartyLineCall = useOnlineStore(s => s.cancelPartyLineCall)
  const hangupPartyLineCall = useOnlineStore(s => s.hangupPartyLineCall)
  const voiceEnabled = useVoiceStore(s => s.enabled)
  const voicePermission = useVoiceStore(s => s.permission)
  const voiceStatus = useVoiceStore(s => s.status)
  const voiceError = useVoiceStore(s => s.error)
  const micOpen = useVoiceStore(s => s.micOpen)
  const startVoice = useVoiceStore(s => s.start)

  useEffect(() => {
    if (phase === 'partyIntro') navigate('/online/party-intro')
    if (phase === 'partyResult') navigate('/online/party-result')
    if (phase === 'ended') navigate('/online/end')
  }, [phase, navigate])

  const activePlayers = useMemo(() => (
    (partyLineRound?.players?.length ? partyLineRound.players : players)
      .filter(player => !player.disconnected && player.id !== myId)
  ), [myId, partyLineRound?.players, players])
  const submitted = !!myPartyLine?.submitted || !!partyLineRound?.submittedPlayerIds?.includes(myId)

  // timbre mientras hay una llamada entrante; se corta al contestar,
  // rechazar o si quien llama cancela
  const incomingCallId = partyLineCalls.find(call => call.status === 'ringing' && call.targetId === myId)?.id
  useEffect(() => {
    if (!incomingCallId) return undefined
    sfx.phoneRing()
    return () => sfx.stopPhoneRing()
  }, [incomingCallId])

  if (!partyLineRound || !myPartyLine) {
    return (
      <PhoneScreen className="online-voice-screen partyline-screen">
        <div style={{ padding: 40, color: 'var(--text-2)', textAlign: 'center' }}>
          Esperando la llamada privada...
        </div>
      </PhoneScreen>
    )
  }

  return (
    <>
      <PartyLineVoiceDirector calls={partyLineCalls} myId={myId} />
      <PhoneScreen
        className="online-discussion-screen partyline-screen partyline-round-screen"
        leftPanel={
          <div className="discussion-side-stack">
            <PrivateLineCard privateRound={myPartyLine} round={partyLineRound} />
            <PartyLinePhonePanel
              players={partyLineRound.players}
              myId={myId}
              calls={partyLineCalls}
              voiceEnabled={voiceEnabled}
              voicePermission={voicePermission}
              voiceStatus={voiceStatus}
              voiceError={voiceError}
              micOpen={micOpen}
              onStartVoice={startVoice}
              onCall={requestPartyLineCall}
              onAccept={acceptPartyLineCall}
              onDecline={declinePartyLineCall}
              onCancel={cancelPartyLineCall}
              onHangup={hangupPartyLineCall}
            />
          </div>
        }
        footer={
          <div className={`partyline-submit-state ${submitted ? 'is-sent' : ''}`}>
            <span>{partyLineRound.submittedCount || 0}/{partyLineRound.totalPlayers || 0} respuestas</span>
            <strong>{submitted ? 'Respuesta enviada' : 'Elige y confirma tu jugada'}</strong>
          </div>
        }
      >
      <main className="partyline-round">
        <header className="partyline-round__hero">
          <div>
            <span className="t-eyebrow">Línea Privada · ronda {partyLineRound.round}/{partyLineRound.totalRounds}</span>
            <h1>{partyLineRound.title || partyLineRound.game?.title}</h1>
            <p>{partyLineRound.publicPrompt}</p>
          </div>
          <span className="partyline-round__tag">{partyLineRound.game?.shortTitle || 'Llamada'}</span>
        </header>

        <section className={`partyline-action-panel ${submitted ? 'is-sent' : ''}`}>
          <div className="partyline-action-panel__head">
            <span className="partyline-action-panel__eyebrow">Decisión secreta</span>
            <span className="partyline-action-panel__state">{submitted ? 'Enviado' : partyLineRound.game?.actionLabel}</span>
          </div>
          {submitted && <span className="stamp stamp--green stamp--tilt-r partyline-action-panel__stamp">Enviado</span>}
          <PartyLineAction
            key={partyLineRound.id}
            round={partyLineRound}
            privateRound={myPartyLine}
            players={activePlayers}
            disabled={submitted}
            onSubmit={(payload) => { sfx.partySubmit(); submitPartyLineAction(payload) }}
          />
        </section>

        <section className="partyline-table">
          <SectionHeader right={`${partyLineRound.players.length} líneas`}>Jugadores en llamada</SectionHeader>
          <div className="partyline-player-grid">
            {partyLineRound.players.map(player => (
              <article
                key={player.id}
                className={`partyline-player ${player.id === myId ? 'is-you' : ''} ${partyLineRound.submittedPlayerIds?.includes(player.id) ? 'is-ready' : ''}`}
              >
                <Avatar player={player} />
                <div>
                  <strong>{player.name}</strong>
                  <span>{player.id === myId ? 'Tu línea' : partyLineRound.submittedPlayerIds?.includes(player.id) ? 'Decisión enviada' : 'En llamada'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      </PhoneScreen>
    </>
  )
}

function PartyLineVoiceDirector({ calls = [], myId }) {
  const enabled = useVoiceStore(s => s.enabled)
  const permission = useVoiceStore(s => s.permission)
  const start = useVoiceStore(s => s.start)
  const stop = useVoiceStore(s => s.stop)
  const hadPhoneVoice = useRef(false)
  const voiceCall = calls.find(call => (
    (call.status === 'active' || (call.status === 'ringing' && call.callerId === myId)) &&
    (call.callerId === myId || call.targetId === myId)
  ))

  useEffect(() => {
    if (voiceCall) {
      hadPhoneVoice.current = true
      if (!enabled && permission !== 'prompting') void start()
      return
    }

    if (hadPhoneVoice.current) {
      hadPhoneVoice.current = false
      if (enabled) stop()
    }
  }, [enabled, permission, start, stop, voiceCall])

  return null
}

export function PartyLinePhonePanel({
  players = [],
  myId,
  calls = [],
  voiceEnabled,
  voicePermission,
  voiceStatus,
  voiceError,
  micOpen,
  onStartVoice,
  onCall,
  onAccept,
  onDecline,
  onCancel,
  onHangup,
}) {
  const activeCall = calls.find(call => call.status === 'active' && (call.callerId === myId || call.targetId === myId))
  const incomingCall = calls.find(call => call.status === 'ringing' && call.targetId === myId)
  const outgoingCall = calls.find(call => call.status === 'ringing' && call.callerId === myId)
  const currentCall = activeCall || incomingCall || outgoingCall
  const currentPeer = currentCall ? callPeer(currentCall, myId) : null
  const canStartCall = !activeCall && !outgoingCall
  const otherPlayers = players.filter(player => player.id !== myId && !player.disconnected)
  const needsVoice = !!activeCall || !!outgoingCall

  const handleCall = (targetId) => {
    sfx.uiTap()
    void onStartVoice()
    onCall(targetId)
  }

  const handleAccept = (callId) => {
    sfx.phonePickup()
    void onStartVoice()
    onAccept(callId)
  }

  return (
    <aside className="partyline-phone-panel">
      <div className="partyline-phone-panel__head">
        <span className="partyline-phone-panel__title">Centralita</span>
        <span className="partyline-phone-panel__mode">
          {activeCall ? 'conectado' : incomingCall ? 'entrante' : outgoingCall ? 'llamando' : 'libre'}
        </span>
      </div>

      <div className={`partyline-phone-status ${activeCall ? 'is-active' : incomingCall ? 'is-incoming' : outgoingCall ? 'is-outgoing' : ''}`}>
        <span className="partyline-phone-status__lamp" aria-hidden="true" />
        <div>
          <strong>
            {activeCall
              ? `En llamada con ${currentPeer?.name || 'jugador'}`
              : incomingCall
                ? `${currentPeer?.name || 'Un jugador'} te llama`
                : outgoingCall
                  ? `Llamando a ${currentPeer?.name || 'jugador'}`
                  : 'Línea disponible'}
          </strong>
          <p>
            {activeCall
              ? 'Solo ustedes dos se escuchan.'
              : incomingCall
                ? 'Puedes contestar, rechazar o llamar a otra persona.'
                : outgoingCall
                  ? 'Esperando respuesta.'
                  : 'Llama a alguien libre para negociar en privado.'}
          </p>
        </div>
      </div>

      {incomingCall && (
        <div className="partyline-phone-actions">
          <button type="button" className="btn btn-primary" onClick={() => handleAccept(incomingCall.id)}>
            Contestar
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => { sfx.phoneHangup(); onDecline(incomingCall.id) }}>
            Rechazar
          </button>
        </div>
      )}

      {outgoingCall && (
        <button type="button" className="btn btn-secondary partyline-phone-wide" onClick={() => { sfx.phoneHangup(); onCancel(outgoingCall.id) }}>
          Cancelar llamada
        </button>
      )}

      {activeCall && (
        <button type="button" className="btn btn-primary partyline-phone-wide" onClick={() => { sfx.phoneHangup(); onHangup(activeCall.id) }}>
          Colgar
        </button>
      )}

      {(needsVoice || incomingCall) && (
        <div className={`partyline-phone-voice ${voiceEnabled && micOpen ? 'is-live' : ''} ${voicePermission === 'denied' || voiceError ? 'is-blocked' : ''}`}>
          <span />
          <div>
            <strong>{phoneVoiceTitle({ activeCall, outgoingCall, incomingCall, voiceEnabled, micOpen, voicePermission, voiceStatus })}</strong>
            <small>{phoneVoiceText({ activeCall, outgoingCall, incomingCall, voiceEnabled, voicePermission, voiceStatus, voiceError })}</small>
          </div>
          {needsVoice && !voiceEnabled && (
            <button type="button" onClick={onStartVoice}>
              Activar
            </button>
          )}
        </div>
      )}

      <div className="partyline-phone-list">
        {otherPlayers.map(player => {
          const status = phoneStatusFor(player.id, calls)
          const disabled = !canStartCall || status.busy
          return (
            <button
              type="button"
              key={player.id}
              className={`partyline-phone-line ${status.busy ? 'is-busy' : 'is-free'}`}
              disabled={disabled}
              onClick={() => handleCall(player.id)}
            >
              <span className="partyline-phone-line__jack" aria-hidden="true" />
              <Avatar player={player} />
              <span className="partyline-phone-line__id">
                <strong>{player.name}</strong>
                <small>{status.label}</small>
              </span>
              <em>{disabled ? 'Ocupado' : 'Llamar'}</em>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function phoneVoiceTitle({ activeCall, outgoingCall, incomingCall, voiceEnabled, micOpen, voicePermission, voiceStatus }) {
  if (voicePermission === 'denied') return 'Micrófono bloqueado'
  if (incomingCall && !activeCall) return 'Audio al contestar'
  if (!voiceEnabled) return 'Preparando audio'
  if (micOpen) return 'Audio conectado'
  if (voiceStatus === 'connecting') return 'Conectando audio'
  if (outgoingCall) return 'Esperando audio'
  return 'Audio en espera'
}

function phoneVoiceText({ activeCall, outgoingCall, incomingCall, voiceEnabled, voicePermission, voiceStatus, voiceError }) {
  if (voiceError) return voiceError
  if (voicePermission === 'denied') return 'Permite el micrófono del navegador para usar llamadas privadas.'
  if (incomingCall && !activeCall) return 'Al contestar se abre una llamada solo entre ustedes dos.'
  if (!voiceEnabled) return 'El teléfono intentará activar el micrófono automáticamente.'
  if (activeCall) return 'El resto de la mesa no escucha esta llamada.'
  if (outgoingCall) return voiceStatus === 'connecting' ? 'Abriendo canal privado...' : 'Tu micrófono queda listo si contestan.'
  return 'La llamada privada está lista.'
}

function callPeer(call, myId) {
  if (!call) return null
  if (call.callerId === myId) {
    return { id: call.targetId, name: call.targetName, avatar: call.targetAvatar }
  }
  return { id: call.callerId, name: call.callerName, avatar: call.callerAvatar }
}

function phoneStatusFor(playerId, calls = []) {
  const active = calls.find(call => call.status === 'active' && (call.callerId === playerId || call.targetId === playerId))
  if (active) return { busy: true, label: 'En llamada' }
  const outgoing = calls.find(call => call.status === 'ringing' && call.callerId === playerId)
  if (outgoing) return { busy: true, label: 'Llamando' }
  const incoming = calls.find(call => call.status === 'ringing' && call.targetId === playerId)
  if (incoming) return { busy: true, label: 'Recibiendo llamada' }
  return { busy: false, label: 'Disponible' }
}

export function PrivateLineCard({ privateRound, round }) {
  const title = privateTitle(privateRound, round)
  const body = privateBody(privateRound)

  return (
    <aside className={`discussion-dossier partyline-private-card partyline-private-card--${privateRound.gameId || 'generic'}`}>
      <div className="case-rail__stamp">Tu línea</div>
      <div className="discussion-dossier__role">
        <Badge color="var(--gold)" dot>{round.game?.shortTitle || 'Privado'}</Badge>
        <span>Ronda {round.round}/{round.totalRounds}</span>
      </div>
      <div className="discussion-dossier__secret">
        <span>{title.label}</span>
        <strong>{title.value}</strong>
        {title.meta && <small>{title.meta}</small>}
      </div>
      <div className="discussion-dossier__strategy">
        <span>Instrucción</span>
        <p>{privateRound.instruction}</p>
      </div>
      {body && (
        <div className="discussion-dossier__status">
          {body}
        </div>
      )}
    </aside>
  )
}

function privateTitle(privateRound) {
  if (privateRound.gameId === 'neighbors') {
    const left = privateRound.leftRoomNumber || '???'
    const right = privateRound.rightRoomNumber || '???'
    return { label: 'Habitación', value: privateRound.roomNumber || '???', meta: `Izquierda: cuarto ${left} / Derecha: cuarto ${right}` }
  }
  if (privateRound.gameId === 'message') {
    return { label: 'Fragmento', value: privateRound.fragment || 'Sin fragmento', meta: privateRound.isDecoy ? 'Tu pieza fue plantada.' : 'Tu pieza pertenece al mensaje real.' }
  }
  if (privateRound.gameId === 'dilemma') {
    return { label: privateRound.solo ? 'Operador libre' : 'Cómplice', value: privateRound.partner?.name || 'Sin pareja', meta: privateRound.solo ? 'No tienes pacto real.' : 'Solo tú sabes esta pareja.' }
  }
  return {
    label: 'Oficio',
    value: privateRound.role || privateRound.identity || 'Sin oficio',
    meta: privateRound.protocolStatus || 'Protocolo privado',
  }
}

function privateBody(privateRound) {
  if (privateRound.gameId === 'neighbors') return 'El orden es numérico. Para que todos tengan dos vecinos, el primer cuarto conecta con el último.'
  if (privateRound.gameId === 'message' && privateRound.isDecoy) return 'Miente por llamada para retrasar a quienes intentan reconstruir la frase.'
  if (privateRound.gameId === 'message') return 'Llama para juntar fragmentos y escribe la frase completa apenas la descubras.'
  if (privateRound.gameId === 'identity') {
    return (
      <div className="partyline-protocol-card">
        <span>Procedimiento privado</span>
        <ol>
          {(privateRound.protocol || []).map((step, index) => (
            <li key={`${step}-${index}`}>{step}</li>
          ))}
        </ol>
        {!!privateRound.keywords?.length && (
          <small>Códigos: {privateRound.keywords.join(' / ')}</small>
        )}
      </div>
    )
  }
  return ''
}

export function PartyLineAction({ round, privateRound, players, disabled, onSubmit }) {
  if (round.actionType === 'neighbor-pick') {
    return <NeighborAction players={players} privateRound={privateRound} disabled={disabled} onSubmit={onSubmit} />
  }
  if (round.actionType === 'message-reconstruct') {
    return (
      <MessageAction
        players={players}
        privateRound={privateRound}
        max={round.publicInfo?.decoyCount || 1}
        disabled={disabled}
        onSubmit={onSubmit}
      />
    )
  }
  if (round.actionType === 'suspect-list') {
    return (
      <MultiSuspectAction
        players={players}
        max={round.publicInfo?.decoyCount || 1}
        disabled={disabled}
        onSubmit={suspectIds => onSubmit({ suspectIds })}
      />
    )
  }
  if (round.actionType === 'dilemma-choice') {
    return <DilemmaAction privateRound={privateRound} disabled={disabled} onSubmit={choice => onSubmit({ choice })} />
  }
  if (round.actionType === 'protocol-accuse') {
    return (
      <ProtocolAction
        players={players}
        details={round.publicInfo?.detailOptions || []}
        disabled={disabled}
        onSubmit={onSubmit}
      />
    )
  }
  return (
    <SingleSuspectAction
      players={players}
      disabled={disabled}
      onSubmit={targetId => onSubmit({ targetId })}
    />
  )
}

/* ── Vecinos: pasillo de puertas ── */
export function NeighborAction({ players, privateRound, disabled, onSubmit }) {
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  const [activeSide, setActiveSide] = useState('left')
  const left = players.find(player => player.id === leftId)
  const right = players.find(player => player.id === rightId)
  const canSubmit = leftId && rightId && leftId !== rightId && !disabled

  const pickDoor = (side) => {
    if (disabled) return
    if (side === 'left' && leftId) setLeftId('')
    if (side === 'right' && rightId) setRightId('')
    setActiveSide(side)
  }

  const assignGuest = (playerId) => {
    if (disabled) return
    if (activeSide === 'left') {
      if (rightId === playerId) setRightId('')
      setLeftId(playerId)
      if (!rightId || rightId === playerId) setActiveSide('right')
    } else {
      if (leftId === playerId) setLeftId('')
      setRightId(playerId)
      if (!leftId || leftId === playerId) setActiveSide('left')
    }
  }

  const swap = () => {
    if (disabled) return
    setLeftId(rightId)
    setRightId(leftId)
  }

  return (
    <div className="pl-corridor-game">
      <div className="pl-corridor" role="group" aria-label="Pasillo de habitaciones">
        <DoorSlot
          side="left"
          label="Cuarto anterior"
          roomNumber={privateRound?.leftRoomNumber}
          guest={left}
          active={activeSide === 'left' && !disabled}
          disabled={disabled}
          onClick={() => pickDoor('left')}
        />
        <div className="pl-door pl-door--you">
          <span className="pl-door__label">Tu cuarto</span>
          <div className="pl-door__frame">
            <span className="pl-door__plate">{privateRound?.roomNumber || '???'}</span>
            <span className="pl-door__name">Tú</span>
          </div>
        </div>
        <DoorSlot
          side="right"
          label="Cuarto siguiente"
          roomNumber={privateRound?.rightRoomNumber}
          guest={right}
          active={activeSide === 'right' && !disabled}
          disabled={disabled}
          onClick={() => pickDoor('right')}
        />
      </div>

      <div className="pl-corridor-hint">
        {disabled
          ? 'Vecinos registrados en recepción.'
          : `Señala la puerta ${activeSide === 'left' ? 'izquierda' : 'derecha'} y elige al huésped que duerme ahí.`}
      </div>

      <div className="pl-guest-board">
        <span className="pl-guest-board__title">Huéspedes del pasillo</span>
        <div className="pl-guest-grid">
          {players.map(player => {
            const tag = player.id === leftId ? 'IZQ' : player.id === rightId ? 'DER' : ''
            return (
              <button
                type="button"
                key={player.id}
                disabled={disabled}
                className={`pl-guest ${tag ? 'is-assigned' : ''}`}
                onClick={() => assignGuest(player.id)}
              >
                <Avatar player={player} />
                <strong>{player.name}</strong>
                {tag && <span className="pl-guest__tag">{tag}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pl-corridor-actions">
        {leftId && rightId && !disabled && (
          <button type="button" className="btn btn-ghost" onClick={swap}>⇄ Intercambiar lados</button>
        )}
        <button className="btn btn-primary" disabled={!canSubmit} onClick={() => onSubmit({ leftId, rightId })}>
          Fijar vecinos
        </button>
      </div>
    </div>
  )
}

function DoorSlot({ side, label, roomNumber, guest, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`pl-door pl-door--${side} ${active ? 'is-active' : ''} ${guest ? 'is-filled' : ''}`}
      onClick={onClick}
    >
      <span className="pl-door__label">{label}</span>
      <span className="pl-door__frame">
        {roomNumber && <span className="pl-door__plate pl-door__plate--small">{roomNumber}</span>}
        {guest ? (
          <>
            <PlayerAvatar avatar={guest.avatar} name={guest.name} className="pl-door__avatar" />
            <span className="pl-door__name">{guest.name}</span>
          </>
        ) : (
          <span className="pl-door__empty">¿?</span>
        )}
      </span>
      <span className="pl-door__hint">{guest ? 'Tocar para vaciar' : active ? 'Eligiendo…' : 'Tocar puerta'}</span>
    </button>
  )
}

/* ── Mensaje interceptado: telegrama ── */
export function MessageAction({ players, privateRound, max, disabled, onSubmit }) {
  const [phraseGuess, setPhraseGuess] = useState('')
  const [selected, setSelected] = useState([])
  const cleanPhrase = phraseGuess.trim()
  const canSubmit = cleanPhrase.length >= 4 && !disabled
  const toggle = (id) => {
    if (disabled) return
    setSelected(current => {
      if (current.includes(id)) return current.filter(item => item !== id)
      if (current.length >= max) return current
      return [...current, id]
    })
  }

  return (
    <div className="pl-telegram-game">
      {privateRound?.fragment && (
        <div className={`pl-fragment ${privateRound.isDecoy ? 'is-decoy' : ''}`}>
          <span className="pl-fragment__label">Tu fragmento</span>
          <strong className="pl-fragment__text">«{privateRound.fragment}»</strong>
          {privateRound.isDecoy && <span className="pl-fragment__warn">pieza plantada — despista a la mesa</span>}
        </div>
      )}

      <label className="pl-telegram">
        <span className="pl-telegram__head">
          <em>Telegrama</em>
          <em>Transcripción de la frase</em>
        </span>
        <textarea
          value={phraseGuess}
          maxLength={240}
          disabled={disabled}
          onChange={event => setPhraseGuess(event.target.value)}
          placeholder="Escribe aquí la frase completa…"
        />
        <span className="pl-telegram__foot">
          <small>une los fragmentos por llamada</small>
          <small>{phraseGuess.length}/240</small>
        </span>
      </label>

      <div className="pl-suspect-section">
        <span className="pl-step-title">Opcional · ¿quién carga la pieza plantada?</span>
        <p className="pl-step-help">Marca hasta {max} jugador{max === 1 ? '' : 'es'} con fragmento falso.</p>
        <div className="pl-suspect-grid">
          {players.map(player => (
            <SuspectChip
              key={player.id}
              player={player}
              tag="Plantado"
              selected={selected.includes(player.id)}
              disabled={disabled}
              onClick={() => toggle(player.id)}
            />
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        disabled={!canSubmit}
        onClick={() => onSubmit({ phraseGuess: cleanPhrase, suspectIds: selected })}
      >
        Enviar frase
      </button>
    </div>
  )
}

/* ── Dilema del cómplice: cartas de decisión ── */
export function DilemmaAction({ privateRound, disabled, onSubmit }) {
  const [choice, setChoice] = useState('')

  return (
    <div className="pl-dilemma-game">
      <div className="pl-pact-note">
        {privateRound.solo ? (
          <>
            <strong>Operas sin cómplice real.</strong>
            <p>Nadie comparte tu pacto esta ronda; tu decisión igual suma puntos.</p>
          </>
        ) : (
          <>
            <strong>
              Tu cómplice:&nbsp;
              <span className="pl-pact-note__partner">
                <PlayerAvatar avatar={privateRound.partner?.avatar} name={privateRound.partner?.name} className="pl-pact-note__avatar" />
                {privateRound.partner?.name || 'otro jugador'}
              </span>
            </strong>
            <p>Pueden pactar por llamada, pero la decisión final es secreta.</p>
          </>
        )}
      </div>

      <div className="pl-dilemma-cards" role="radiogroup" aria-label="Decisión del dilema">
        <button
          type="button"
          role="radio"
          aria-checked={choice === 'cooperate'}
          disabled={disabled}
          className={`pl-dilemma-card pl-dilemma-card--coop ${choice === 'cooperate' ? 'is-chosen' : ''}`}
          onClick={() => setChoice('cooperate')}
        >
          <span className="pl-dilemma-card__icon">🤝</span>
          <span className="pl-dilemma-card__title">Cooperar</span>
          <span className="pl-dilemma-card__desc">Honras el pacto. Vale oro… si el otro también lo honra.</span>
          <span className="pl-dilemma-card__seal">Tu elección</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={choice === 'betray'}
          disabled={disabled}
          className={`pl-dilemma-card pl-dilemma-card--betray ${choice === 'betray' ? 'is-chosen' : ''}`}
          onClick={() => setChoice('betray')}
        >
          <span className="pl-dilemma-card__icon">🗡</span>
          <span className="pl-dilemma-card__title">Traicionar</span>
          <span className="pl-dilemma-card__desc">Te quedas con todo… salvo que el otro piense igual.</span>
          <span className="pl-dilemma-card__seal">Tu elección</span>
        </button>
      </div>

      <button
        className="btn btn-primary"
        disabled={disabled || !choice}
        onClick={() => onSubmit(choice)}
      >
        {choice ? `Confirmar: ${choice === 'cooperate' ? 'cooperar' : 'traicionar'}` : 'Elige una carta'}
      </button>
    </div>
  )
}

/* ── Código de oficio: acusación en dos pasos ── */
export function ProtocolAction({ players, details, disabled, onSubmit }) {
  const [targetId, setTargetId] = useState('')
  const [detailId, setDetailId] = useState('')
  const canSubmit = targetId && detailId && !disabled
  const target = players.find(player => player.id === targetId)

  return (
    <div className="pl-protocol-game">
      <div className="pl-suspect-section">
        <span className="pl-step-title"><i>Paso 01</i> El sospechoso</span>
        <p className="pl-step-help">Llama, compara procedimientos y señala a quien recite el protocolo alterado.</p>
        <div className="pl-suspect-grid">
          {players.map(player => (
            <SuspectChip
              key={player.id}
              player={player}
              tag="Acusado"
              selected={targetId === player.id}
              disabled={disabled}
              onClick={() => setTargetId(player.id)}
            />
          ))}
        </div>
      </div>

      <div className={`pl-suspect-section ${!targetId ? 'is-waiting' : ''}`}>
        <span className="pl-step-title"><i>Paso 02</i> El paso que lo delata</span>
        <p className="pl-step-help">
          {target ? `¿Qué detalle del procedimiento de ${target.name} no encaja?` : 'Primero señala a un sospechoso.'}
        </p>
        <div className="pl-detail-list">
          {details.map((detail, index) => (
            <button
              type="button"
              key={detail.id}
              disabled={disabled || !targetId}
              className={`pl-detail ${detailId === detail.id ? 'is-selected' : ''}`}
              onClick={() => setDetailId(detail.id)}
            >
              <span className="pl-detail__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="pl-detail__text">{detail.label}</span>
              <span className="pl-detail__mark">✓</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        disabled={!canSubmit}
        onClick={() => onSubmit({ targetId, detailId })}
      >
        Acusar protocolo
      </button>
    </div>
  )
}

export function MultiSuspectAction({ players, max, disabled, onSubmit }) {
  const [selected, setSelected] = useState([])
  const toggle = (id) => {
    if (disabled) return
    setSelected(current => {
      if (current.includes(id)) return current.filter(item => item !== id)
      if (current.length >= max) return current
      return [...current, id]
    })
  }
  return (
    <div className="pl-suspect-section pl-suspect-section--solo">
      <p className="pl-step-help">Marca {max} fragmento{max === 1 ? '' : 's'} que no pertenezca{max === 1 ? '' : 'n'} al mensaje.</p>
      <div className="pl-suspect-grid">
        {players.map(player => (
          <SuspectChip
            key={player.id}
            player={player}
            tag="Plantado"
            selected={selected.includes(player.id)}
            disabled={disabled}
            onClick={() => toggle(player.id)}
          />
        ))}
      </div>
      <button className="btn btn-primary" disabled={disabled || selected.length !== max} onClick={() => onSubmit(selected)}>
        Enviar sospechas
      </button>
    </div>
  )
}

export function SingleSuspectAction({ players, disabled, onSubmit }) {
  const [targetId, setTargetId] = useState('')
  return (
    <div className="pl-suspect-section pl-suspect-section--solo">
      <p className="pl-step-help">Elige quién crees que tiene una identidad distinta.</p>
      <div className="pl-suspect-grid">
        {players.map(player => (
          <SuspectChip
            key={player.id}
            player={player}
            tag="Acusado"
            selected={targetId === player.id}
            disabled={disabled}
            onClick={() => setTargetId(player.id)}
          />
        ))}
      </div>
      <button className="btn btn-primary" disabled={disabled || !targetId} onClick={() => onSubmit(targetId)}>
        Enviar acusación
      </button>
    </div>
  )
}

function SuspectChip({ player, tag, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={!!selected}
      className={`pl-suspect ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      <Avatar player={player} />
      <strong>{player.name}</strong>
      <span className="pl-suspect__tag">{tag}</span>
    </button>
  )
}

function Avatar({ player }) {
  return <PlayerAvatar avatar={player?.avatar} name={player?.name} className="partyline-avatar" />
}
