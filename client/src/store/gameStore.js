import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { appendRecentWord, buildSession } from '../utils/roleAssigner.js'
import { checkVictory, leaderInVotes, activePlayers } from '../utils/gameLogic.js'

const defaultPlayers = ['Carlos', 'María', 'Andrés', 'Sofía'].map((n, i) => ({ id: String(i), name: n }))

const defaultConfig = {
  players: defaultPlayers,
  impostorCount: 1,
  mode: 'classic',           // classic | clue | blind
  category: 'random',
  clueType: 'category',      // category | firstLetter | wordLength | vague | antonym | custom
  customClue: '',
  blindIntensity: 'medium',  // near | medium | far
  roundTime: '3',            // 1 | 3 | 5 | free
}

function buildTrackedSession(config, recentWords) {
  const session = buildSession(config, { recentWords })
  const baseHistory = session.wordHistoryReset ? [] : recentWords
  return {
    session,
    recentWords: appendRecentWord(baseHistory, session.word),
  }
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      config: defaultConfig,
      session: null,
      recentWords: [],

      setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      setPlayers: (players) => set((s) => ({ config: { ...s.config, players } })),

      // ----- Lifecycle -----
      startSession: () => {
        const cfg = get().config
        set(buildTrackedSession(cfg, get().recentWords))
      },

      endSession: () => set({ session: null, recentWords: [] }),

      rematch: () => {
        const cfg = get().config
        set(buildTrackedSession(cfg, get().recentWords))
      },

      // ----- Card reveal flow -----
      advanceReveal: () => set((s) => {
        if (!s.session) return s
        const next = s.session.revealIndex + 1
        if (next >= s.session.players.length) {
          return { session: { ...s.session, revealIndex: next, phase: 'discussion' } }
        }
        return { session: { ...s.session, revealIndex: next } }
      }),

      // ----- Voting (local pass-and-play: el dispositivo cuenta votos manualmente) -----
      castVote: (targetId) => set((s) => {
        if (!s.session) return s
        const votes = { ...(s.session.votes || {}) }
        votes[targetId] = (votes[targetId] || 0) + 1
        return { session: { ...s.session, votes } }
      }),

      clearVotes: () => set((s) => s.session ? ({ session: { ...s.session, votes: {} } }) : s),

      confirmElimination: () => set((s) => {
        if (!s.session) return s
        const leader = leaderInVotes(s.session.votes, s.session.players)
        if (!leader?.winner) return s
        const players = s.session.players.map(p =>
          p.id === leader.winner ? { ...p, eliminated: true } : p
        )
        const newSession = {
          ...s.session,
          players,
          eliminatedIds: [...s.session.eliminatedIds, leader.winner],
          lastEliminated: leader.winner,
          votes: {},
        }
        const victory = checkVictory(newSession)
        if (victory) {
          return { session: { ...newSession, phase: 'ended', winner: victory } }
        }
        return { session: { ...newSession, phase: 'discussion' } }
      }),

      manuallyEliminate: (playerId) => set((s) => {
        if (!s.session) return s
        const players = s.session.players.map(p =>
          p.id === playerId ? { ...p, eliminated: true } : p
        )
        const newSession = {
          ...s.session,
          players,
          eliminatedIds: [...s.session.eliminatedIds, playerId],
          lastEliminated: playerId,
          votes: {},
        }
        const victory = checkVictory(newSession)
        if (victory) return { session: { ...newSession, phase: 'ended', winner: victory } }
        return { session: newSession }
      }),

      impostorGuess: (word) => set((s) => {
        if (!s.session) return s
        const correct = word.trim().toLowerCase() === s.session.word.toLowerCase()
        const newSession = {
          ...s.session,
          impostorGuessedWord: correct,
        }
        if (correct) {
          return { session: { ...newSession, phase: 'ended', winner: { winner: 'impostor', reason: 'wordGuessed' } } }
        }
        return { session: newSession }
      }),

      newRound: () => set((s) => {
        if (!s.session) return s
        return { session: { ...s.session, round: s.session.round + 1, votes: {}, phase: 'discussion' } }
      }),

      setPhase: (phase) => set((s) => s.session ? ({ session: { ...s.session, phase } }) : s),

      // Helpers
      activePlayers: () => get().session ? activePlayers(get().session) : [],
      hasSavedGame: () => !!get().session && get().session.phase !== 'ended',
    }),
    {
      name: 'el-impostor-game',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ config: state.config, session: state.session, recentWords: state.recentWords }),
    }
  )
)
