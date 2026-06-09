import { shuffle, pickOne, pickWithout } from './random.js'
import { wordBank, categories, relatedWords } from '../data/wordBank.js'
import { avatarForPlayer } from '../data/avatars.js'
import { ROLE_DETECTIVE_BLIND, isImpostorRole } from './roles.js'

export const RECENT_WORD_LIMIT = 10

export function normalizeWordKey(word) {
  return String(word ?? '').trim().toLowerCase()
}

export function appendRecentWord(recentWords = [], word, limit = RECENT_WORD_LIMIT) {
  const wordKey = normalizeWordKey(word)
  const current = Array.isArray(recentWords) ? recentWords : []
  if (!wordKey) return current.slice(-limit)

  const withoutCurrentWord = current.filter(item => normalizeWordKey(item) !== wordKey)
  return [...withoutCurrentWord, word].slice(-limit)
}

export function pickWordAvoidingRecent(words, recentWords = []) {
  const candidates = Array.isArray(words) ? words.filter(Boolean) : []
  if (!candidates.length) return { word: null, resetHistory: false }

  const recentKeys = new Set(
    (Array.isArray(recentWords) ? recentWords : [])
      .map(normalizeWordKey)
      .filter(Boolean)
  )
  const available = candidates.filter(word => !recentKeys.has(normalizeWordKey(word)))
  const resetHistory = available.length === 0

  return {
    word: pickOne(resetHistory ? candidates : available),
    resetHistory,
  }
}

// Devuelve un objeto session con jugadores, roles y palabras.
// config = { players: [{id, name}], impostorCount, mode, category, clueType?, blindIntensity?, customClue?, roundTime }
export function buildSession(config, options = {}) {
  const playerCount = config.players.length
  const maxImpostors = Math.max(1, Math.floor(playerCount / 3))
  const impostorCount = Math.max(1, Math.min(Math.floor(config.impostorCount || 1), maxImpostors))
  const catKey = config.category === 'random'
    ? pickOne(Object.keys(wordBank))
    : (wordBank[config.category] ? config.category : 'lugares')
  const words = wordBank[catKey] || wordBank.lugares
  const selectedWord = pickWordAvoidingRecent(words, options.recentWords || config.recentWords)
  const word = selectedWord.word

  // Selección aleatoria de impostores
  const indices = shuffle(config.players.map((_, i) => i))
  const impostorIndices = new Set(indices.slice(0, impostorCount))

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
      avatar: avatarForPlayer(p),
      role: isImpostor ? 'impostor' : 'citizen',
      // Palabra que verá: ciudadanos ven la real, impostores depende del modo
      seenWord: isImpostor
        ? (config.mode === 'blind' ? fakeWord : null)
        : word,
      eliminated: false,
    }
  })

  if (config.detectiveEnabled) {
    const detective = pickOne(sessionPlayers)
    if (detective) {
      const wasImpostor = isImpostorRole(detective.role)
      if (wasImpostor && config.mode === 'blind') {
        detective.role = ROLE_DETECTIVE_BLIND
        detective.seenWord = fakeWord
        const replacement = pickOne(sessionPlayers.filter(player => (
          player.id !== detective.id && player.role === 'citizen'
        )))
        if (replacement) {
          replacement.role = 'impostor'
          replacement.seenWord = fakeWord
        }
      } else {
        detective.role = wasImpostor ? 'detective-impostor' : 'detective'
        detective.seenWord = wasImpostor ? null : word
      }
    }
  }

  return {
    id: `s_${Date.now()}`,
    createdAt: Date.now(),
    config: { ...config, category: catKey, impostorCount },
    word,
    fakeWord,
    clue,
    category: catKey,
    categoryLabel: categories[catKey]?.label || catKey,
    wordHistoryReset: selectedWord.resetHistory,
    players: sessionPlayers,
    speakOrder: shuffle(sessionPlayers.map(p => p.id)),
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
  const related = relatedWords[catKey]?.[realWord]
  if (related && related.length) {
    if (intensity === 'near') return related[0]
    if (intensity === 'far') return related[2] || related[related.length - 1]
    return related[1] || related[0]
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
    misterio: 'Algo inexplicable',
    colombia: 'Algo típicamente colombiano',
    musica: 'Algo que se escucha',
    literatura: 'Algo que se lee',
    videojuegos: 'Un mundo interactivo',
    seriesTv: 'Una historia por episodios',
    mitologia: 'Un relato legendario',
    cocteles: 'Una bebida preparada',
    marcas: 'Un nombre reconocido',
    arte: 'Una expresion creativa',
    arquitectura: 'Una construccion disenada',
    geografia: 'Un lugar o forma del planeta',
    astronomia: 'Algo del espacio',
    gastronomiaColombiana: 'Un sabor colombiano',
  }
  return map[catKey] || 'Algo que existe'
}
