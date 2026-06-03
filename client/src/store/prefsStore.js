import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const usePrefsStore = create(
  persist(
    (set) => ({
      sound: true,
      vibration: true,
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleVibration: () => set((s) => ({ vibration: !s.vibration })),
      setSound: (v) => set({ sound: !!v }),
      setVibration: (v) => set({ vibration: !!v }),
    }),
    {
      name: 'el-impostor-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
