export const PLAYER_AVATARS = [
  '🕵️', '🎭', '👑', '🔥', '⚡', '🌙',
  '🧠', '💎', '🛡️', '🗡️', '🎯', '🎲',
  '🚀', '🪐', '🌟', '🌈', '🍀', '🌵',
  '🐺', '🦊', '🐼', '🐸', '🐙', '🦉',
  '👻', '🤖', '👽', '🧙', '🥷', '🦸',
  '🎸', '🎧', '⚽', '🏆', '🍕', '☕',
]

export function defaultAvatarForName(name = '') {
  const text = String(name || '').trim()
  const seed = [...text].reduce((sum, char) => sum + char.codePointAt(0), 0)
  return PLAYER_AVATARS[seed % PLAYER_AVATARS.length]
}

export function normalizeAvatar(avatar, name = '') {
  return PLAYER_AVATARS.includes(avatar) ? avatar : defaultAvatarForName(name)
}
