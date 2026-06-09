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
    return {
      ...base,
      canSpeak: false,
      reason: me?.eliminated || phase === 'spectator' ? 'Solo escucha como espectador' : 'Sin jugador activo',
      allowedPeerIds: [],
      channel: 'closed',
      channelLabel: 'Solo escucha',
      channelDescription: 'No puedes abrir microfono en este estado.',
    }
  }
  if (phase === 'reveal') {
    return {
      ...base,
      canSpeak: false,
      reason: 'Silencio durante la revelacion de rol',
      allowedPeerIds: [],
      channel: 'closed',
      channelLabel: 'Revelacion privada',
      channelDescription: 'La voz se pausa mientras cada jugador ve su carta.',
    }
  }
  if (phase === 'voting' || phase === 'voted') {
    return {
      ...base,
      canSpeak: false,
      reason: 'Silencio durante la votacion',
      allowedPeerIds: [],
      channel: 'closed',
      channelLabel: 'Votacion',
      channelDescription: 'La voz se pausa durante la votacion.',
    }
  }
  if (phase === 'ended') {
    return {
      ...base,
      canSpeak: false,
      reason: 'La partida termino',
      allowedPeerIds: [],
      channel: 'closed',
      channelLabel: 'Partida terminada',
      channelDescription: 'La voz queda cerrada al finalizar la partida.',
    }
  }

  if (phase !== 'lobby' && phase !== 'discussion') {
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
