// Lógica pura del juego — sin estado, sin efectos.

export function activePlayers(session) {
  return session.players.filter(p => !p.eliminated)
}

export function leaderInVotes(votes, players) {
  const entries = Object.entries(votes)
  if (!entries.length) return null
  const max = Math.max(...entries.map(([, c]) => c))
  if (max === 0) return null
  const leaders = entries.filter(([, c]) => c === max).map(([id]) => id)
  // Necesita mayoría: > 50% de los jugadores activos
  const totalActive = players.filter(p => !p.eliminated).length
  const required = Math.floor(totalActive / 2) + 1
  const hasMajority = leaders.length === 1 && max >= required
  return {
    ids: leaders,
    count: max,
    required,
    hasMajority,
    winner: hasMajority ? leaders[0] : null,
  }
}

export function checkVictory(session) {
  const active = activePlayers(session)
  const activeImpostors = active.filter(p => p.role === 'impostor')
  const activeCitizens = active.filter(p => p.role === 'citizen')

  if (session.impostorGuessedWord) {
    return { winner: 'impostor', reason: 'wordGuessed' }
  }
  if (activeImpostors.length === 0) {
    return { winner: 'citizens', reason: 'allImpostorsCaught' }
  }
  if (activeImpostors.length >= activeCitizens.length) {
    return { winner: 'impostor', reason: 'majority' }
  }
  return null
}

export function isPlayerImpostor(session, playerId) {
  return session.players.find(p => p.id === playerId)?.role === 'impostor'
}
