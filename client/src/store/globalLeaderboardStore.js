import { create } from 'zustand'
import { SERVER_URL } from '../config/server.js'

export const useGlobalLeaderboardStore = create((set) => ({
  players: [],
  loading: false,
  available: null,
  source: null,
  error: null,

  loadLeaderboard: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`${SERVER_URL}/leaderboard?limit=50`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      set({
        players: Array.isArray(data.players) ? data.players : [],
        available: data.available !== false,
        source: data.source || null,
        loading: false,
        error: data.error || null,
      })
    } catch (error) {
      set({
        players: [],
        available: false,
        loading: false,
        error: error?.message || 'No se pudo cargar el ranking',
      })
    }
  },
}))
