import { describe, expect, it } from 'vitest'
import {
  applyGameResult,
  impostorRate,
  playerStatsKey,
  sortedPlayerStats,
  winRate,
} from '../statsStore.js'

function initialState() {
  return { players: {}, recordedGameIds: [] }
}

describe('statsStore helpers', () => {
  it('registra partidas por nombre de jugador y evita duplicados por gameId', () => {
    const result = {
      gameId: 'local-1',
      winner: 'citizens',
      playedAt: 1000,
      players: [
        { name: ' Ana ', role: 'citizen' },
        { name: 'Luis', role: 'impostor' },
      ],
    }

    const state = applyGameResult(initialState(), result)
    const duplicated = applyGameResult(state, result)

    expect(state.players.ana.gamesPlayed).toBe(1)
    expect(state.players.ana.wins).toBe(1)
    expect(state.players.ana.citizenGames).toBe(1)
    expect(state.players.luis.losses).toBe(1)
    expect(duplicated.players.ana.gamesPlayed).toBe(1)
    expect(duplicated.recordedGameIds).toEqual(['local-1'])
  })

  it('actualiza rachas, victorias por rol y porcentajes', () => {
    let state = initialState()
    state = applyGameResult(state, {
      gameId: 'g1',
      winner: 'citizens',
      players: [{ name: 'Ana', role: 'citizen' }],
    })
    state = applyGameResult(state, {
      gameId: 'g2',
      winner: 'impostor',
      players: [{ name: 'Ana', role: 'impostor' }],
    })
    state = applyGameResult(state, {
      gameId: 'g3',
      winner: 'citizens',
      players: [{ name: 'Ana', role: 'impostor' }],
    })

    const ana = state.players[playerStatsKey('Ana')]
    expect(ana.gamesPlayed).toBe(3)
    expect(ana.wins).toBe(2)
    expect(ana.impostorGames).toBe(2)
    expect(ana.impostorWins).toBe(1)
    expect(ana.currentStreak).toBe(0)
    expect(ana.bestStreak).toBe(2)
    expect(winRate(ana)).toBe(67)
    expect(impostorRate(ana)).toBe(67)
  })

  it('ordena jugadores por partidas y luego por nombre', () => {
    let state = initialState()
    state = applyGameResult(state, {
      gameId: 'g1',
      winner: 'citizens',
      players: [
        { name: 'Carlos', role: 'citizen' },
        { name: 'Ana', role: 'citizen' },
      ],
    })
    state = applyGameResult(state, {
      gameId: 'g2',
      winner: 'impostor',
      players: [{ name: 'Carlos', role: 'impostor' }],
    })

    expect(sortedPlayerStats(state.players).map(player => player.name)).toEqual(['Carlos', 'Ana'])
  })
})
