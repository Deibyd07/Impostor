import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { defaultAvatarForName, normalizeAvatar } from '../data/avatars.js'
import { SERVER_URL } from '../config/server.js'

const MAX_PROFILES = 12

function cleanName(name) {
  return String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 16)
}

function normalizeProfile(profile) {
  if (!profile?.id) return null
  const name = cleanName(profile.name) || 'Jugador'
  return {
    id: profile.id,
    name,
    avatar: normalizeAvatar(profile.avatar || defaultAvatarForName(name), name),
    createdAt: profile.createdAt || profile.created_at || Date.now(),
    updatedAt: profile.updatedAt || profile.updated_at || Date.now(),
    lastUsedAt: profile.lastUsedAt || Date.now(),
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || `HTTP ${response.status}`)
  }
  return data
}

export function profileIdentity(profile) {
  if (!profile?.id) return { profileId: null, isGuest: true }
  return { profileId: profile.id, isGuest: false }
}

export const usePlayerProfilesStore = create(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      loading: false,
      error: null,

      syncProfiles: async () => {
        const cachedProfiles = (get().profiles || []).map(normalizeProfile).filter(Boolean)
        if (!cachedProfiles.length) return

        set({ loading: true, error: null })
        try {
          const ids = cachedProfiles.map(profile => profile.id).join(',')
          const remote = await requestJson(`/profiles?ids=${encodeURIComponent(ids)}`)
          const remoteProfiles = (remote.profiles || []).map(normalizeProfile).filter(Boolean)
          const remoteById = new Map(remoteProfiles.map(profile => [profile.id, profile]))
          const createdProfiles = []

          for (const profile of cachedProfiles) {
            if (remoteById.has(profile.id)) continue
            const created = await requestJson('/profiles', {
              method: 'POST',
              body: JSON.stringify({
                id: profile.id,
                name: profile.name,
                avatar: profile.avatar,
              }),
            })
            const synced = normalizeProfile(created.profile)
            if (synced) createdProfiles.push(synced)
          }

          const allById = new Map([...remoteProfiles, ...createdProfiles].map(profile => [profile.id, profile]))
          const profiles = cachedProfiles
            .map(profile => allById.get(profile.id))
            .filter(Boolean)
            .slice(0, MAX_PROFILES)

          set(state => ({
            profiles,
            activeProfileId: profiles.some(profile => profile.id === state.activeProfileId)
              ? state.activeProfileId
              : profiles[0]?.id || null,
            loading: false,
            error: null,
          }))
        } catch (error) {
          set({ loading: false, error: error?.message || 'No se pudieron sincronizar perfiles' })
        }
      },

      createProfile: async (name, avatar) => {
        const clean = cleanName(name)
        if (!clean) throw new Error('Nombre invalido')

        set({ loading: true, error: null })
        try {
          const data = await requestJson('/profiles', {
            method: 'POST',
            body: JSON.stringify({
              name: clean,
              avatar: normalizeAvatar(avatar || defaultAvatarForName(clean), clean),
            }),
          })
          const profile = normalizeProfile(data.profile)
          if (!profile) throw new Error('Perfil invalido')

          set(state => ({
            profiles: [profile, ...(state.profiles || []).filter(item => item.id !== profile.id)].slice(0, MAX_PROFILES),
            activeProfileId: profile.id,
            loading: false,
            error: null,
          }))
          return profile
        } catch (error) {
          set({ loading: false, error: error?.message || 'No se pudo crear el perfil' })
          throw error
        }
      },

      updateProfile: async (id, patch = {}) => {
        set({ loading: true, error: null })
        try {
          const data = await requestJson(`/profiles/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: patch.name,
              avatar: patch.avatar,
            }),
          })
          const profile = normalizeProfile(data.profile)
          if (!profile) throw new Error('Perfil invalido')

          set(state => ({
            profiles: (state.profiles || []).map(item => item.id === id ? { ...profile, lastUsedAt: item.lastUsedAt || Date.now() } : item),
            loading: false,
            error: null,
          }))
          return profile
        } catch (error) {
          set({ loading: false, error: error?.message || 'No se pudo actualizar el perfil' })
          throw error
        }
      },

      deleteProfile: async (id) => {
        set({ loading: true, error: null })
        try {
          await requestJson(`/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' })
          set(state => {
            const profiles = (state.profiles || []).filter(profile => profile.id !== id)
            return {
              profiles,
              activeProfileId: state.activeProfileId === id ? (profiles[0]?.id || null) : state.activeProfileId,
              loading: false,
              error: null,
            }
          })
        } catch (error) {
          set({ loading: false, error: error?.message || 'No se pudo borrar el perfil' })
          throw error
        }
      },

      setActiveProfile: (id) => {
        set(state => {
          const profile = (state.profiles || []).find(item => item.id === id)
          if (!profile) return { activeProfileId: null }
          return {
            activeProfileId: profile.id,
            profiles: state.profiles.map(item => (
              item.id === profile.id ? { ...item, lastUsedAt: Date.now() } : item
            )),
          }
        })
      },

      activeProfile: () => {
        const state = get()
        return (state.profiles || []).find(profile => profile.id === state.activeProfileId) || null
      },
    }),
    {
      name: 'el-impostor-player-profiles',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
    }
  )
)
