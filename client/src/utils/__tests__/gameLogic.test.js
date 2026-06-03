import { describe, it, expect } from 'vitest'
import { activePlayers, leaderInVotes, checkVictory, isPlayerImpostor } from '../gameLogic.js'

function makeSession(players, extra = {}) {
  return { players, impostorGuessedWord: false, ...extra }
}

describe('activePlayers', () => {
  it('filtra a los eliminados', () => {
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

  it('devuelve null si no hay votos', () => {
    expect(leaderInVotes({}, players)).toBe(null)
  })

  it('un único líder con mayoría gana', () => {
    // 4 activos, mayoría = ceil(4/2) = 2
    const r = leaderInVotes({ a: 2, b: 1 }, players)
    expect(r.winner).toBe('a')
    expect(r.hasMajority).toBe(true)
  })

  it('líder sin mayoría no gana', () => {
    const players5 = [...players, { id: 'e' }]
    // mayoría = ceil(5/2) = 3
    const r = leaderInVotes({ a: 2, b: 1 }, players5)
    expect(r.winner).toBe(null)
    expect(r.hasMajority).toBe(false)
  })

  it('empate no produce ganador', () => {
    const r = leaderInVotes({ a: 2, b: 2 }, players)
    expect(r.winner).toBe(null)
    expect(r.ids.sort()).toEqual(['a', 'b'])
  })

  it('ignora a los eliminados al calcular la mayoría', () => {
    const ps = [
      { id: 'a' }, { id: 'b' }, { id: 'c', eliminated: true }, { id: 'd', eliminated: true },
    ]
    // 2 activos, mayoría = 1
    const r = leaderInVotes({ a: 1 }, ps)
    expect(r.winner).toBe('a')
  })
})

describe('checkVictory', () => {
  it('los ciudadanos ganan al eliminar al último impostor', () => {
    const s = makeSession([
      { id: 'a', role: 'citizen', eliminated: false },
      { id: 'b', role: 'citizen', eliminated: false },
      { id: 'c', role: 'impostor', eliminated: true },
    ])
    expect(checkVictory(s)).toEqual({ winner: 'citizens', reason: 'allImpostorsCaught' })
  })

  it('el impostor gana cuando hay tantos impostores como ciudadanos activos', () => {
    const s = makeSession([
      { id: 'a', role: 'impostor', eliminated: false },
      { id: 'b', role: 'citizen', eliminated: false },
      { id: 'c', role: 'citizen', eliminated: true },
    ])
    expect(checkVictory(s)?.winner).toBe('impostor')
  })

  it('el impostor gana si adivina la palabra', () => {
    const s = makeSession([
      { id: 'a', role: 'impostor', eliminated: false },
      { id: 'b', role: 'citizen', eliminated: false },
      { id: 'c', role: 'citizen', eliminated: false },
    ], { impostorGuessedWord: true })
    expect(checkVictory(s)).toEqual({ winner: 'impostor', reason: 'wordGuessed' })
  })

  it('partida en curso devuelve null', () => {
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
  it('reconoce al impostor', () => {
    const s = makeSession([
      { id: 'a', role: 'impostor' }, { id: 'b', role: 'citizen' },
    ])
    expect(isPlayerImpostor(s, 'a')).toBe(true)
    expect(isPlayerImpostor(s, 'b')).toBe(false)
    expect(isPlayerImpostor(s, 'z')).toBe(false)
  })
})
