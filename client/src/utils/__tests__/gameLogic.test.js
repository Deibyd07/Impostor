import { describe, it, expect } from 'vitest'
import { activePlayers, leaderInVotes, checkVictory, isPlayerImpostor } from '../gameLogic.js'

function makeSession(players, extra = {}) {
  return { players, impostorGuessedWord: false, ...extra }
}

describe('activePlayers', () => {
  it('filters eliminated players', () => {
    const s = makeSession([
      { id: 'a', eliminated: false },
      { id: 'b', eliminated: true },
      { id: 'c', eliminated: false },
    ])
    expect(activePlayers(s).map(p => p.id)).toEqual(['a', 'c'])
  })
})

describe('leaderInVotes', () => {
  const players = [
    { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' },
  ]

  it('returns null when there are no votes', () => {
    expect(leaderInVotes({}, players)).toBe(null)
  })

  it('a single leader with strict majority wins', () => {
    const r = leaderInVotes({ a: 3, b: 1 }, players)
    expect(r.winner).toBe('a')
    expect(r.hasMajority).toBe(true)
    expect(r.required).toBe(3)
  })

  it('a leader without strict majority does not win', () => {
    const r = leaderInVotes({ a: 2, b: 1 }, players)
    expect(r.winner).toBe(null)
    expect(r.hasMajority).toBe(false)
    expect(r.required).toBe(3)
  })

  it('a leader without majority in an odd table does not win', () => {
    const players5 = [...players, { id: 'e' }]
    const r = leaderInVotes({ a: 2, b: 1 }, players5)
    expect(r.winner).toBe(null)
    expect(r.hasMajority).toBe(false)
    expect(r.required).toBe(3)
  })

  it('a tie does not produce a winner', () => {
    const r = leaderInVotes({ a: 2, b: 2 }, players)
    expect(r.winner).toBe(null)
    expect(r.ids.sort()).toEqual(['a', 'b'])
  })

  it('ignores eliminated players when calculating majority', () => {
    const ps = [
      { id: 'a' }, { id: 'b' }, { id: 'c', eliminated: true }, { id: 'd', eliminated: true },
    ]
    const r = leaderInVotes({ a: 2 }, ps)
    expect(r.winner).toBe('a')
    expect(r.required).toBe(2)
  })
})

describe('checkVictory', () => {
  it('citizens win when the last impostor is eliminated', () => {
    const s = makeSession([
      { id: 'a', role: 'citizen', eliminated: false },
      { id: 'b', role: 'citizen', eliminated: false },
      { id: 'c', role: 'impostor', eliminated: true },
    ])
    expect(checkVictory(s)).toEqual({ winner: 'citizens', reason: 'allImpostorsCaught' })
  })

  it('the impostor wins when active impostors match active citizens', () => {
    const s = makeSession([
      { id: 'a', role: 'impostor', eliminated: false },
      { id: 'b', role: 'citizen', eliminated: false },
      { id: 'c', role: 'citizen', eliminated: true },
    ])
    expect(checkVictory(s)?.winner).toBe('impostor')
  })

  it('the impostor wins after guessing the word', () => {
    const s = makeSession([
      { id: 'a', role: 'impostor', eliminated: false },
      { id: 'b', role: 'citizen', eliminated: false },
      { id: 'c', role: 'citizen', eliminated: false },
    ], { impostorGuessedWord: true })
    expect(checkVictory(s)).toEqual({ winner: 'impostor', reason: 'wordGuessed' })
  })

  it('returns null while the game is still running', () => {
    const s = makeSession([
      { id: 'a', role: 'impostor', eliminated: false },
      { id: 'b', role: 'citizen', eliminated: false },
      { id: 'c', role: 'citizen', eliminated: false },
      { id: 'd', role: 'citizen', eliminated: false },
    ])
    expect(checkVictory(s)).toBe(null)
  })
})

describe('isPlayerImpostor', () => {
  it('detects the impostor', () => {
    const s = makeSession([
      { id: 'a', role: 'impostor' }, { id: 'b', role: 'citizen' },
    ])
    expect(isPlayerImpostor(s, 'a')).toBe(true)
    expect(isPlayerImpostor(s, 'b')).toBe(false)
    expect(isPlayerImpostor(s, 'z')).toBe(false)
  })
})
