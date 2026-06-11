export function isActiveVoicePlayer(player) {
  return !!player && !player.eliminated && !player.disconnected
}

function activePartyLineCallFor(calls, myId) {
  return (calls || []).find(call => (
    call?.status === 'active' &&
    (call.callerId === myId || call.targetId === myId)
  )) || null
}

function pendingPartyLineCallFor(calls, myId) {
  return (calls || []).find(call => (
    call?.status === 'ringing' &&
    (call.callerId === myId || call.targetId === myId)
  )) || null
}

function partyLinePeer(call, myId) {
  if (!call) return null
  if (call.callerId === myId) {
    return { id: call.targetId, name: call.targetName || 'otro jugador' }
  }
  return { id: call.callerId, name: call.callerName || 'otro jugador' }
}

export function resolveVoiceChannel({
  roomCode,
  myId,
  players = [],
  phase,
  interrogation,
  partyLineCalls = [],
  isPartyLineMode = false,
}) {
  const me = players.find(player => player.id === myId)
  const base = {
    canSpeak: true,
    reason: null,
    allowedPeerIds: null,
    channel: 'room',
    channelLabel: 'Sala completa',
    channelDescription: 'Escucha y habla con los jugadores conectados.',
  }

  if (!roomCode || !myId) {
    return {
      ...base,
      canSpeak: false,
      reason: 'Sin sala activa',
      allowedPeerIds: [],
      channel: 'closed',
      channelLabel: 'Voz cerrada',
      channelDescription: 'No hay una sala activa para conectar voz.',
    }
  }

  if (isPartyLineMode && phase !== 'lobby') {
    if (phase === 'partyRound' && isActiveVoicePlayer(me)) {
      const call = activePartyLineCallFor(partyLineCalls, myId)
      const peer = partyLinePeer(call, myId)
      if (call && peer?.id) {
        return {
          ...base,
          canSpeak: true,
          reason: null,
          allowedPeerIds: [peer.id],
          channel: 'party-call',
          channelLabel: 'Llamada privada',
          channelDescription: `Solo estas conectado con ${peer.name}.`,
        }
      }

      const pending = pendingPartyLineCallFor(partyLineCalls, myId)
      const pendingPeer = partyLinePeer(pending, myId)
      return {
        ...base,
        canSpeak: false,
        reason: pending
          ? pending.callerId === myId
            ? 'Esperando respuesta'
            : 'Llamada entrante'
          : 'Sin llamada activa',
        allowedPeerIds: [],
        channel: pending ? 'party-ringing' : 'party-wait',
        channelLabel: pending ? 'Linea en espera' : 'Telefono libre',
        channelDescription: pending
          ? pending.callerId === myId
            ? `Esperando que ${pendingPeer?.name || 'el jugador'} conteste.`
            : `${pendingPeer?.name || 'Un jugador'} te esta llamando.`
          : 'La voz se abre solo cuando una llamada privada esta conectada.',
      }
    }

    return {
      ...base,
      canSpeak: false,
      reason: 'Voz telefonica privada',
      allowedPeerIds: [],
      channel: 'party-wait',
      channelLabel: 'Telefono privado',
      channelDescription: 'En Linea Privada no hay voz de sala durante la partida.',
    }
  }

  if (!isActiveVoicePlayer(me)) {
    const activeIds = players
      .filter(isActiveVoicePlayer)
      .map(player => player.id)
      .filter(id => id !== myId)

    if (interrogation) {
      const privateIds = new Set([interrogation.detectiveId, interrogation.targetId].filter(Boolean))
      return {
        ...base,
        canSpeak: false,
        reason: me?.eliminated || phase === 'spectator' ? 'Solo escucha como espectador' : 'Sin jugador activo',
        allowedPeerIds: activeIds.filter(id => !privateIds.has(id)),
        channel: 'table',
        channelLabel: 'Modo escucha',
        channelDescription: 'Puedes escuchar la mesa, pero no hablar.',
      }
    }

    return {
      ...base,
      canSpeak: false,
      reason: me?.eliminated || phase === 'spectator' ? 'Solo escucha como espectador' : 'Sin jugador activo',
      allowedPeerIds: activeIds,
      channel: 'listen',
      channelLabel: 'Solo escucha',
      channelDescription: 'Puedes escuchar a la mesa, pero no hablar.',
    }
  }

  if (!['lobby', 'caseIntro', 'reveal', 'discussion', 'voting', 'voted', 'roundResult', 'ended'].includes(phase)) {
    return {
      ...base,
      canSpeak: false,
      reason: 'Voz pausada',
      allowedPeerIds: [],
      channel: 'closed',
      channelLabel: 'Voz pausada',
      channelDescription: 'La voz se reabre cuando vuelve la mesa.',
    }
  }

  if (!interrogation) return base

  const privateIds = new Set([interrogation.detectiveId, interrogation.targetId].filter(Boolean))
  const localIsPrivate = privateIds.has(myId)
  const activeIds = players
    .filter(isActiveVoicePlayer)
    .map(player => player.id)
    .filter(id => id !== myId)

  if (localIsPrivate) {
    return {
      ...base,
      allowedPeerIds: activeIds.filter(id => privateIds.has(id)),
      channel: 'interrogation',
      channelLabel: 'Canal privado',
      channelDescription: 'Solo detective e interrogado se escuchan entre ellos.',
    }
  }

  return {
    ...base,
    allowedPeerIds: activeIds.filter(id => !privateIds.has(id)),
    channel: 'table',
    channelLabel: 'Mesa secundaria',
    channelDescription: 'La mesa puede hablar aparte sin escuchar el interrogatorio.',
  }
}
