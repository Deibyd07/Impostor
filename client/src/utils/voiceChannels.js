export function isActiveVoicePlayer(player) {
  return !!player && !player.eliminated && !player.disconnected
}

export function resolveVoiceChannel({
  roomCode,
  myId,
  players = [],
  phase,
  interrogation,
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
