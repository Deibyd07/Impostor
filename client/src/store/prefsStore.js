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
      musicVolume: 1,
      sfxVolume: 1,
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleVibration: () => set((s) => ({ vibration: !s.vibration })),
      setSound: (v) => set({ sound: !!v }),
      setVibration: (v) => set({ vibration: !!v }),
      setMusicVolume: (v) => set({ musicVolume: clampVolume(v) }),
      setSfxVolume: (v) => set({ sfxVolume: clampVolume(v) }),
    }),
    {
      name: 'el-impostor-prefs',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') return {}
        if ((version ?? 0) < 3) {
          // versiones anteriores tenían un único campo `volume`
          const legacyVol = Number(persistedState.volume)
          const base = Number.isFinite(legacyVol) ? Math.max(0, Math.min(1, legacyVol)) : 1
          return {
            sound: persistedState.sound ?? true,
            vibration: persistedState.vibration ?? true,
            musicVolume: base,
            sfxVolume: base,
          }
        }
        return persistedState
      },
    }
  )
)
