export const GAME_TYPE_IMPOSTOR = 'impostor'
export const GAME_TYPE_ALIBI = 'alibi'
export const GAME_TYPE_PARTYLINE = 'partyline'

export function gameTypeFromConfig(config) {
  if (config?.gameType === GAME_TYPE_PARTYLINE || config?.mode === GAME_TYPE_PARTYLINE) {
    return GAME_TYPE_PARTYLINE
  }
  if (config?.gameType === GAME_TYPE_ALIBI || config?.mode === GAME_TYPE_ALIBI) {
    return GAME_TYPE_ALIBI
  }
  return GAME_TYPE_IMPOSTOR
}

export function isAlibiGame(config) {
  return gameTypeFromConfig(config) === GAME_TYPE_ALIBI
}

export function isPartyLineGame(config) {
  return gameTypeFromConfig(config) === GAME_TYPE_PARTYLINE
}

export function isImpostorGame(config) {
  return gameTypeFromConfig(config) === GAME_TYPE_IMPOSTOR
}
