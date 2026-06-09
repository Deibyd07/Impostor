import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function clampVolume(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.max(0, Math.min(1, n))
}

export const usePrefsStore = create(
  persist(
    (set) => ({
      sound: true,
      vibration: true,
      volume: 1,
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleVibration: () => set((s) => ({ vibration: !s.vibration })),
      setSound: (v) => set({ sound: !!v }),
      setVibration: (v) => set({ vibration: !!v }),
      setVolume: (v) => set({ volume: clampVolume(v) }),
    }),
    {
      name: 'el-impostor-prefs',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState
        if ((version ?? 0) < 2 && Number(persistedState.volume) === 0.8) {
          return { ...persistedState, volume: 1 }
        }
        return persistedState
      },
    }
  )
)
