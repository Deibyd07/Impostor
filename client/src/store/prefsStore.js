import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function clampVolume(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0.8
  return Math.max(0, Math.min(1, n))
}

export const usePrefsStore = create(
  persist(
    (set) => ({
      sound: true,
      vibration: true,
      volume: 0.8,
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleVibration: () => set((s) => ({ vibration: !s.vibration })),
      setSound: (v) => set({ sound: !!v }),
      setVibration: (v) => set({ vibration: !!v }),
      setVolume: (v) => set({ volume: clampVolume(v) }),
    }),
    {
      name: 'el-impostor-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
