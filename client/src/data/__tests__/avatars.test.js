import { describe, expect, it, vi } from 'vitest'
import {
  IMAGE_AVATARS,
  PLAYER_AVATARS,
  avatarForPlayer,
  avatarImageFor,
  defaultAvatarForName,
  isImageAvatar,
  isValidAvatar,
  rememberAvatarForName,
  savedAvatarForName,
} from '../avatars.js'

describe('avatars', () => {
  it('expone solo avatares visuales validos', () => {
    expect(IMAGE_AVATARS.length).toBe(45)
    expect(PLAYER_AVATARS).toEqual(IMAGE_AVATARS)
    PLAYER_AVATARS.forEach(avatar => {
      expect(isValidAvatar(avatar)).toBe(true)
    })
    expect(isImageAvatar('av01')).toBe(true)
    expect(avatarImageFor('av01')).toBeTruthy()
    expect(isValidAvatar(String.fromCodePoint(0x1F451))).toBe(false)
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

    rememberAvatarForName(' Ana ', 'av01')

    expect(savedAvatarForName('ana')).toBe('av01')
    expect(avatarForPlayer({ name: 'ANA' })).toBe('av01')

    vi.unstubAllGlobals()
  })
})
