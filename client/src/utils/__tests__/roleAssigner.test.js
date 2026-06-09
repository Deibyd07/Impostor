import { describe, it, expect } from 'vitest'
import {
  RECENT_WORD_LIMIT,
  appendRecentWord,
  buildSession,
  pickWordAvoidingRecent,
} from '../roleAssigner.js'
import { wordBank, categories, relatedWords } from '../../data/wordBank.js'
import { isDetectiveRole, isImpostorRole } from '../roles.js'

const newCategoryKeys = [
  'videojuegos',
  'seriesTv',
  'mitologia',
  'cocteles',
  'marcas',
  'arte',
  'arquitectura',
  'geografia',
  'astronomia',
  'gastronomiaColombiana',
]

function players(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }))
}

describe('buildSession - clásico', () => {
  it('asigna exactamente N impostores', () => {
    for (let i = 0; i < 30; i++) {
      const s = buildSession({
        players: players(6), impostorCount: 2, mode: 'classic', category: 'animales',
      })
      const impostors = s.players.filter(p => p.role === 'impostor')
      expect(impostors.length).toBe(2)
    }
  })

  it('limita los impostores al maximo permitido por cantidad de jugadores', () => {
    const s = buildSession({
      players: players(3), impostorCount: 4, mode: 'classic', category: 'animales',
    })
    const impostors = s.players.filter(p => p.role === 'impostor')
    expect(impostors.length).toBe(1)
    expect(s.config.impostorCount).toBe(1)
  })

  it('los ciudadanos ven la palabra real, los impostores no', () => {
    const s = buildSession({
      players: players(4), impostorCount: 1, mode: 'classic', category: 'comida',
    })
    s.players.forEach(p => {
      if (p.role === 'citizen') expect(p.seenWord).toBe(s.word)
      else expect(p.seenWord).toBe(null)
    })
  })

  it('la palabra pertenece a la categoría elegida', () => {
    const s = buildSession({
      players: players(4), impostorCount: 1, mode: 'classic', category: 'animales',
    })
    expect(wordBank.animales).toContain(s.word)
  })

  it('si detective esta activo mantiene un solo detective y respeta el equipo impostor', () => {
    for (let i = 0; i < 30; i++) {
      const s = buildSession({
        players: players(6), impostorCount: 2, mode: 'classic', category: 'animales',
        detectiveEnabled: true,
      })
      expect(s.players.filter(p => isDetectiveRole(p.role))).toHaveLength(1)
      expect(s.players.filter(p => isImpostorRole(p.role))).toHaveLength(2)
    }
  })
})

describe('buildSession - con pista', () => {
  it('produce una pista no vacía', () => {
    const s = buildSession({
      players: players(5), impostorCount: 1, mode: 'clue', clueType: 'category', category: 'tecnologia',
    })
    expect(s.clue).toBeTruthy()
  })

  it('clueType=firstLetter contiene la primera letra de la palabra', () => {
    const s = buildSession({
      players: players(4), impostorCount: 1, mode: 'clue', clueType: 'firstLetter', category: 'animales',
    })
    expect(s.clue).toContain(s.word.charAt(0).toUpperCase())
  })

  it('clueType=custom respeta el texto provisto', () => {
    const s = buildSession({
      players: players(4), impostorCount: 1, mode: 'clue', clueType: 'custom',
      category: 'animales', customClue: 'animal con manchas',
    })
    expect(s.clue).toBe('animal con manchas')
  })
})

describe('buildSession - modo ciego', () => {
  it('genera fakeWord distinta a la real', () => {
    for (let i = 0; i < 20; i++) {
      const s = buildSession({
        players: players(4), impostorCount: 1, mode: 'blind',
        blindIntensity: 'medium', category: 'animales',
      })
      expect(s.fakeWord).toBeTruthy()
      expect(s.fakeWord).not.toBe(s.word)
    }
  })

  it('en intensidad near, si hay relatedWords, usa el primer relacionado', () => {
    const realWord = Object.keys(relatedWords.animales).find(w => wordBank.animales.includes(w))
    if (!realWord) return
    // Forzar que la palabra elegida sea esta - corremos varias veces y validamos solo cuando coincide
    let validated = false
    for (let i = 0; i < 200 && !validated; i++) {
      const s = buildSession({
        players: players(4), impostorCount: 1, mode: 'blind',
        blindIntensity: 'near', category: 'animales',
      })
      if (s.word === realWord) {
        expect(s.fakeWord).toBe(relatedWords.animales[realWord][0])
        validated = true
      }
    }
  })

  it('los impostores ven la fakeWord, no la palabra real', () => {
    const s = buildSession({
      players: players(5), impostorCount: 2, mode: 'blind',
      blindIntensity: 'medium', category: 'lugares',
    })
    const impostors = s.players.filter(p => p.role === 'impostor')
    impostors.forEach(p => {
      expect(p.seenWord).toBe(s.fakeWord)
      expect(p.seenWord).not.toBe(s.word)
    })
  })
  it('funciona con las categorias nuevas', () => {
    newCategoryKeys.forEach(category => {
      const s = buildSession({
        players: players(4), impostorCount: 1, mode: 'blind',
        blindIntensity: 'medium', category,
      })
      expect(s.category).toBe(category)
      expect(s.fakeWord).toBeTruthy()
      expect(s.fakeWord).not.toBe(s.word)
      expect(wordBank[category]).toContain(s.word)
    })
  })
})

describe('relatedWords - cobertura modo ciego', () => {
  it('mapea todas las palabras del banco con minimo 3 relacionadas', () => {
    Object.entries(wordBank).forEach(([category, words]) => {
      words.forEach(word => {
        expect(relatedWords[category]?.[word]?.length ?? 0).toBeGreaterThanOrEqual(3)
      })
    })
  })

  it('mantiene near, medium y far en la misma categoria sin repetir la palabra real', () => {
    Object.entries(wordBank).forEach(([category, words]) => {
      words.forEach(word => {
        const related = relatedWords[category][word].slice(0, 3)
        expect(new Set(related).size).toBe(3)
        related.forEach(candidate => {
          expect(candidate).not.toBe(word)
          expect(wordBank[category]).toContain(candidate)
        })
      })
    })
  })
})

describe('buildSession - estado inicial', () => {
  it('arranca en fase reveal, ronda 1, sin votos ni eliminados', () => {
    const s = buildSession({
      players: players(4), impostorCount: 1, mode: 'classic', category: 'animales',
    })
    expect(s.phase).toBe('reveal')
    expect(s.round).toBe(1)
    expect(s.revealIndex).toBe(0)
    expect(s.eliminatedIds).toEqual([])
    expect(s.votes).toEqual({})
    expect(s.impostorGuessedWord).toBe(false)
    expect(s.winner).toBe(null)
  })

  it('mantiene los IDs originales de los jugadores', () => {
    const ps = [{ id: 'alpha', name: 'A' }, { id: 'beta', name: 'B' }, { id: 'gamma', name: 'C' }]
    const s = buildSession({
      players: ps, impostorCount: 1, mode: 'classic', category: 'animales',
    })
    expect(s.players.map(p => p.id).sort()).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('mantiene el avatar elegido por jugador', () => {
    const ps = [{ id: 'alpha', name: 'A', avatar: '👑' }, { id: 'beta', name: 'B', avatar: '🦊' }, { id: 'gamma', name: 'C', avatar: '🚀' }]
    const s = buildSession({
      players: ps, impostorCount: 1, mode: 'classic', category: 'animales',
    })
    expect(s.players.map(p => p.avatar).sort()).toEqual(['👑', '🦊', '🚀'].sort())
  })

  it('category=random escoge una categoría válida', () => {
    const s = buildSession({
      players: players(4), impostorCount: 1, mode: 'classic', category: 'random',
    })
    expect(Object.keys(wordBank)).toContain(s.category)
    expect(wordBank[s.category]).toContain(s.word)
  })

  it('todas las categorias del selector tienen minimo 30 palabras', () => {
    Object.keys(categories).forEach(category => {
      expect(wordBank[category]?.length ?? 0).toBeGreaterThanOrEqual(30)
    })
  })
})

describe('historial de palabras', () => {
  it('no repite palabras dentro de las ultimas 10 partidas de una categoria', () => {
    let recentWords = []
    const pickedWords = []

    for (let i = 0; i < RECENT_WORD_LIMIT; i++) {
      const s = buildSession({
        players: players(4), impostorCount: 1, mode: 'classic', category: 'animales',
      }, { recentWords })

      expect(recentWords).not.toContain(s.word)
      pickedWords.push(s.word)
      recentWords = appendRecentWord(recentWords, s.word)
    }

    expect(new Set(pickedWords).size).toBe(RECENT_WORD_LIMIT)
  })

  it('mantiene solo las ultimas 10 palabras del historial', () => {
    const history = wordBank.animales
      .slice(0, RECENT_WORD_LIMIT + 1)
      .reduce((recentWords, word) => appendRecentWord(recentWords, word), [])

    expect(history).toHaveLength(RECENT_WORD_LIMIT)
    expect(history).not.toContain(wordBank.animales[0])
    expect(history).toContain(wordBank.animales[RECENT_WORD_LIMIT])
  })

  it('reinicia el historial cuando no quedan palabras disponibles', () => {
    const words = wordBank.animales.slice(0, 3)
    const selected = pickWordAvoidingRecent(words, words)

    expect(selected.resetHistory).toBe(true)
    expect(words).toContain(selected.word)
  })
})
