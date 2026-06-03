import { shuffle, pickOne, pickWithout } from './random.js'
import { wordBank, categories, relatedWords } from '../data/wordBank.js'

// Devuelve un objeto session con jugadores, roles y palabras.
// config = { players: [{id, name}], impostorCount, mode, category, clueType?, blindIntensity?, customClue?, roundTime }
export function buildSession(config) {
  const catKey = config.category === 'random'
    ? pickOne(Object.keys(wordBank))
    : config.category
  const words = wordBank[catKey] || wordBank.lugares
  const word = pickOne(words)

  // Selección aleatoria de impostores
  const indices = shuffle(config.players.map((_, i) => i))
  const impostorIndices = new Set(indices.slice(0, config.impostorCount))

  const fakeWord = config.mode === 'blind'
    ? pickFakeWord(word, catKey, config.blindIntensity || 'medium')
    : null

  const clue = config.mode === 'clue'
    ? buildClue(word, catKey, config.clueType || 'category', config.customClue)
    : null

  const sessionPlayers = config.players.map((p, i) => {
    const isImpostor = impostorIndices.has(i)
    return {
      id: p.id ?? String(i),
      name: p.name,
      role: isImpostor ? 'impostor' : 'citizen',
      // Palabra que verá: ciudadanos ven la real, impostores depende del modo
      seenWord: isImpostor
        ? (config.mode === 'blind' ? fakeWord : null)
        : word,
      eliminated: false,
    }
  })

  return {
    id: `s_${Date.now()}`,
    createdAt: Date.now(),
    config: { ...config, category: catKey },
    word,
    fakeWord,
    clue,
    category: catKey,
    categoryLabel: categories[catKey]?.label || catKey,
    players: sessionPlayers,
    round: 1,
    revealIndex: 0,
    votes: {}, // { targetId: count }
    voters: {}, // { voterId: targetId }
    eliminatedIds: [],
    phase: 'reveal', // reveal | discussion | voting | ended
    impostorGuessedWord: false,
    winner: null,
  }
}

function pickFakeWord(realWord, catKey, intensity) {
  // 1) intentar palabras relacionadas explícitas
  const related = relatedWords[realWord]
  if (related && related.length) {
    if (intensity === 'near') return related[0]
    if (intensity === 'far') return related[related.length - 1]
    return related[Math.floor(related.length / 2)]
  }
  // 2) palabra aleatoria de la misma categoría (medium)
  // 3) palabra de OTRA categoría (far)
  if (intensity === 'far') {
    const otherCats = Object.keys(wordBank).filter(c => c !== catKey)
    const cat = pickOne(otherCats)
    return pickOne(wordBank[cat])
  }
  return pickWithout(wordBank[catKey], realWord)
}

function buildClue(word, catKey, type, customClue) {
  switch (type) {
    case 'category':    return categories[catKey]?.label || catKey
    case 'firstLetter': return `Empieza con "${word.charAt(0).toUpperCase()}"`
    case 'wordLength':  return `Tiene ${word.replace(/\s/g, '').length} letras`
    case 'vague':       return vagueDefinition(catKey)
    case 'antonym':     return 'Lo opuesto a algo cotidiano'
    case 'custom':      return customClue || '—'
    default:            return categories[catKey]?.label || catKey
  }
}

function vagueDefinition(catKey) {
  const map = {
    animales: 'Un ser vivo',
    comida: 'Algo que se come',
    lugares: 'Un lugar físico',
    objetos: 'Algo que se puede tocar',
    peliculas: 'Una historia narrada',
    deportes: 'Una actividad física',
    profesiones: 'Algo que hace una persona',
    emociones: 'Un sentimiento',
    naturaleza: 'Un fenómeno natural',
    tecnologia: 'Algo moderno',
    historia: 'Algo del pasado',
    musica: 'Algo que se escucha',
    ciencia: 'Algo que se estudia',
    misterio: 'Algo inexplicable',
    colombia: 'Algo típicamente colombiano',
  }
  return map[catKey] || 'Algo que existe'
}
