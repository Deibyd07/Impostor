export const ROLE_DETECTIVE_IMPOSTOR = 'detective-impostor'
export const ROLE_DETECTIVE_BLIND = 'detective-blind'

export function isDetectiveRole(role) {
  return role === 'detective' || role === ROLE_DETECTIVE_IMPOSTOR || role === ROLE_DETECTIVE_BLIND
}

export function isImpostorRole(role) {
  return role === 'impostor' ||
    role === 'impostor-clue' ||
    role === 'impostor-blind' ||
    role === ROLE_DETECTIVE_IMPOSTOR
}

export function isCitizenTeamRole(role) {
  return role === 'citizen' || role === 'detective' || role === ROLE_DETECTIVE_BLIND
}

export function canGuessWordRole(role) {
  return role === 'impostor' ||
    role === 'impostor-clue' ||
    role === ROLE_DETECTIVE_IMPOSTOR
}
