import { describe, expect, it, vi } from 'vitest'
import {
  PLAYER_AVATARS,
  avatarForPlayer,
  defaultAvatarForName,
  isValidAvatar,
  rememberAvatarForName,
  savedAvatarForName,
} from '../avatars.js'

describe('avatars', () => {
  it('expone una grilla de al menos 30 emojis validos', () => {
    expect(PLAYER_AVATARS.length).toBeGreaterThanOrEqual(30)
    PLAYER_AVATARS.forEach(avatar => {
      expect(isValidAvatar(avatar)).toBe(true)
    })
  })

  it('calcula un avatar estable por nombre', () => {
    expect(defaultAvatarForName('Carlos')).toBe(defaultAvatarForName('Carlos'))
    expect(PLAYER_AVATARS).toContain(defaultAvatarForName('Carlos'))
  })

  it('recupera el avatar guardado por nombre', () => {
    const storage = {}
    vi.stubGlobal('localStorage', {
      getItem: key => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value },
    })

    rememberAvatarForName(' Ana ', '👑')

    expect(savedAvatarForName('ana')).toBe('👑')
    expect(avatarForPlayer({ name: 'ANA' })).toBe('👑')

    vi.unstubAllGlobals()
  })
})
