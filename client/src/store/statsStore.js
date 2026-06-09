import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { isImpostorRole } from '../utils/roles.js'

export const MAX_RECORDED_GAMES = 500

export function normalizePlayerName(name) {
  return String(name ?? '').replace(/\s+/g, ' ').trim()
}

export function playerStatsKey(name) {
  return normalizePlayerName(name).toLowerCase()
}

export function emptyPlayerStats(name) {
  return {
    name: normalizePlayerName(name),
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    impostorGames: 0,
    citizenGames: 0,
    impostorWins: 0,
    citizenWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastRole: null,
    lastResult: null,
    lastPlayedAt: null,
  }
}

export function winRate(stats) {
  return stats?.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0
}

export function impostorRate(stats) {
  return stats?.gamesPlayed ? Math.round((stats.impostorGames / stats.gamesPlayed) * 100) : 0
}

export function updatePlayerStats(stats, { role, won, playedAt }) {
  const isImpostor = isImpostorRole(role)
  const nextWins = stats.wins + (won ? 1 : 0)
  const nextLosses = stats.losses + (won ? 0 : 1)
  const nextCurrentStreak = won ? stats.currentStreak + 1 : 0

  return {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    wins: nextWins,
    losses: nextLosses,
    impostorGames: stats.impostorGames + (isImpostor ? 1 : 0),
    citizenGames: stats.citizenGames + (isImpostor ? 0 : 1),
    impostorWins: stats.impostorWins + (isImpostor && won ? 1 : 0),
    citizenWins: stats.citizenWins + (!isImpostor && won ? 1 : 0),
    currentStreak: nextCurrentStreak,
    bestStreak: Math.max(stats.bestStreak, nextCurrentStreak),
    lastRole: role,
    lastResult: won ? 'win' : 'loss',
    lastPlayedAt: playedAt,
  }
}

export function applyGameResult(state, result) {
  const gameId = String(result?.gameId ?? '').trim()
  const winner = result?.winner
  const players = Array.isArray(result?.players) ? result.players : []

  if (!gameId || !['citizens', 'impostor'].includes(winner) || state.recordedGameIds?.includes(gameId)) {
    return state
  }

  const playedAt = Number.isFinite(result?.playedAt) ? result.playedAt : Date.now()
  const nextPlayers = { ...(state.players || {}) }

  players.forEach(player => {
    const name = normalizePlayerName(player?.name)
    const role = player?.role || 'citizen'
    const isImpostor = isImpostorRole(role)
    const key = playerStatsKey(name)
    if (!key) return

    const previous = nextPlayers[key] || emptyPlayerStats(name)
    const won = winner === 'impostor' ? isImpostor : !isImpostor
    nextPlayers[key] = updatePlayerStats({ ...previous, name }, { role, won, playedAt })
  })

  return {
    ...state,
    players: nextPlayers,
    recordedGameIds: [...(state.recordedGameIds || []), gameId].slice(-MAX_RECORDED_GAMES),
  }
}

export function sortedPlayerStats(players = {}) {
  return Object.entries(players)
    .map(([key, stats]) => ({ key, ...stats }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed || a.name.localeCompare(b.name))
}

export const useStatsStore = create(
  persist(
    (set) => ({
      players: {},
      recordedGameIds: [],

      recordGameResult: (result) => set((state) => applyGameResult(state, result)),
      clearStats: () => set({ players: {}, recordedGameIds: [] }),
    }),
    {
      name: 'el-impostor-player-stats',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        players: state.players,
        recordedGameIds: state.recordedGameIds,
      }),
    }
  )
)
