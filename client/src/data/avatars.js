export const IMAGE_AVATARS = Array.from({ length: 45 }, (_, index) => `av${String(index + 1).padStart(2, '0')}`)

export const PLAYER_AVATARS = [...IMAGE_AVATARS]

const AVATAR_STORAGE_KEY = 'el-impostor-player-avatars'
const avatarAssets = import.meta.glob('../assets/avatars/av*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
})

export function isImageAvatar(avatar) {
  return IMAGE_AVATARS.includes(avatar)
}

export function avatarImageFor(avatar) {
  if (!isImageAvatar(avatar)) return null
  return avatarAssets[`../assets/avatars/${avatar}.jpg`] || null
}

export function avatarFallbackFor(avatar, name = '') {
  if (isImageAvatar(avatar)) return ''
  return String(name || '?').trim().charAt(0).toUpperCase() || '?'
}

export function isValidAvatar(avatar) {
  return PLAYER_AVATARS.includes(avatar)
}

export function defaultAvatarForName(name = '') {
  const text = String(name || '').trim()
  const seed = [...text].reduce((sum, char) => sum + char.codePointAt(0), 0)
  return PLAYER_AVATARS[seed % PLAYER_AVATARS.length]
}

export function normalizeAvatar(avatar, name = '') {
  return isValidAvatar(avatar) ? avatar : defaultAvatarForName(name)
}

export function avatarKeyForName(name = '') {
  return String(name || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function loadSavedAvatars() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function savedAvatarForName(name) {
  const key = avatarKeyForName(name)
  const avatar = loadSavedAvatars()[key]
  return isValidAvatar(avatar) ? avatar : null
}

export function rememberAvatarForName(name, avatar) {
  const key = avatarKeyForName(name)
  if (!key || !isValidAvatar(avatar) || typeof localStorage === 'undefined') return
  const saved = loadSavedAvatars()
  saved[key] = avatar
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(saved))
  } catch {}
}

export function avatarForPlayer(player = {}) {
  return normalizeAvatar(player.avatar || savedAvatarForName(player.name), player.name)
}
