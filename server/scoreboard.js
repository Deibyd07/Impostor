const POINTS = {
  participation: 3,
  win: 10,
  impostorWin: 5,
  newBestStreak: 3,
}

function isImpostorRole(role) {
  return role === 'impostor' || role === 'impostor-clue' || role === 'impostor-blind' || role === 'detective-impostor'
}

function playerWon(winner, role) {
  const impostor = isImpostorRole(role)
  return winner === 'impostor' ? impostor : !impostor
}

function emptyScore(player) {
  return {
    playerId: player.id,
    profileId: player.profileId || null,
    isGuest: player.isGuest !== false || !player.profileId,
    name: player.name,
    avatar: player.avatar,
    totalPoints: 0,
    rounds: 0,
    wins: 0,
    impostorWins: 0,
    citizenWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastDelta: 0,
    lastWon: false,
    lastRole: null,
  }
}

function scoreDelta({ role, won, previousBestStreak, nextCurrentStreak }) {
  const breakdown = [{ label: 'Jugar ronda', points: POINTS.participation }]
  if (won) breakdown.push({ label: 'Victoria', points: POINTS.win })
  if (won && isImpostorRole(role)) breakdown.push({ label: 'Victoria impostor', points: POINTS.impostorWin })
  if (won && nextCurrentStreak > previousBestStreak) {
    breakdown.push({ label: 'Mejor racha', points: POINTS.newBestStreak })
  }

  return {
    points: breakdown.reduce((total, item) => total + item.points, 0),
    breakdown,
  }
}

export function applyRoomScoreSummary(room, result) {
  const currentScores = room.roomScores || {}
  const nextScores = { ...currentScores }
  const roundPoints = result.players.map(player => {
    const previous = nextScores[player.id] || emptyScore(player)
    const role = player.role || 'citizen'
    const won = playerWon(result.winner, role)
    const nextCurrentStreak = won ? previous.currentStreak + 1 : 0
    const delta = scoreDelta({
      role,
      won,
      previousBestStreak: previous.bestStreak,
      nextCurrentStreak,
    })
    const next = {
      ...previous,
      playerId: player.id,
      profileId: player.profileId || previous.profileId || null,
      isGuest: player.isGuest !== false || !player.profileId,
      name: player.name,
      avatar: player.avatar,
      totalPoints: previous.totalPoints + delta.points,
      rounds: previous.rounds + 1,
      wins: previous.wins + (won ? 1 : 0),
      impostorWins: previous.impostorWins + (won && isImpostorRole(role) ? 1 : 0),
      citizenWins: previous.citizenWins + (won && !isImpostorRole(role) ? 1 : 0),
      currentStreak: nextCurrentStreak,
      bestStreak: Math.max(previous.bestStreak, nextCurrentStreak),
      lastDelta: delta.points,
      lastWon: won,
      lastRole: role,
    }
    nextScores[player.id] = next
    return {
      playerId: player.id,
      profileId: player.profileId || null,
      isGuest: player.isGuest !== false || !player.profileId,
      name: player.name,
      avatar: player.avatar,
      role,
      won,
      points: delta.points,
      breakdown: delta.breakdown,
      totalPoints: next.totalPoints,
      currentStreak: next.currentStreak,
      bestStreak: next.bestStreak,
    }
  })

  const roomScoreboard = Object.values(nextScores)
    .sort((a, b) => (
      b.totalPoints - a.totalPoints ||
      b.wins - a.wins ||
      a.name.localeCompare(b.name)
    ))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  room.roomScores = nextScores

  return {
    scoring: POINTS,
    roundPoints,
    roomScoreboard,
  }
}
