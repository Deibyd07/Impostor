import path from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { customAlphabet } from 'nanoid'
import { wordBank, categories, relatedWords } from './wordBank.js'
import { normalizeAvatar } from './avatars.js'
import { createRoomStore } from './roomStore.js'
import { createLeaderboardStore } from './leaderboardStore.js'
import { applyRoomScoreSummary } from './scoreboard.js'
import { alibiCases } from './alibiCases.js'
import {
  PARTYLINE_GAME_IDS,
  PARTYLINE_ROUND_OPTIONS,
  createPartyLineRound,
  createPartyLineState,
  partyLineGameOverPayload,
  partyLinePrivateFor,
  partyLineScoreboard,
  publicPartyLineRound,
  publicPartyLineSummary,
  resolvePartyLineRound,
  sanitizePartyLineAction,
  sanitizePartyLineConfig,
} from './partyLineGames.js'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env'), quiet: true })

function envInt(name, fallback) {
  const value = Number.parseInt(process.env[name], 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'
const HTTP_RATE_LIMIT_PER_MINUTE = envInt('HTTP_RATE_LIMIT_PER_MINUTE', 120)
const MAX_CONNECTIONS_PER_IP = envInt('MAX_CONNECTIONS_PER_IP', 5)
const MAX_ROOM_CREATIONS_PER_IP_PER_HOUR = envInt('MAX_ROOM_CREATIONS_PER_IP_PER_HOUR', 10)
const ROOM_CREATION_WINDOW_MS = 60 * 60 * 1000

const app = express()
app.set('trust proxy', 1)
app.use(cors())
app.use(express.json({ limit: '16kb' }))
app.use(rateLimit({
  windowMs: 60_000,
  limit: HTTP_RATE_LIMIT_PER_MINUTE,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || isIpExempt(getClientIpFromRequest(req)),
  keyGenerator: (req) => rateLimitKeyForIp(getClientIpFromRequest(req)),
  handler: (_req, res) => res.status(429).json({
    ok: false,
    error: 'rate_limit',
    message: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en un momento.',
  }),
}))
app.get('/', (_, res) => res.json({ ok: true, app: 'el-impostor', version: '0.2.2' }))
app.get('/leaderboard', async (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10) || 50
  const leaderboard = await leaderboardStore.getLeaderboard({ limit })
  res.json({
    ok: true,
    source: leaderboardStore.type,
    ...leaderboard,
  })
})
app.get('/profiles', async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map(id => sanitizeProfileId(id))
      .filter(Boolean)
    const result = await leaderboardStore.getProfiles({ ids })
    res.json({ ok: true, source: leaderboardStore.type, ...result })
  } catch (error) {
    res.status(500).json({ ok: false, error: 'profiles_read_failed', message: error.message })
  }
})
app.post('/profiles', async (req, res) => {
  try {
    const name = sanitizeName(req.body?.name)
    if (!name) {
      res.status(400).json({ ok: false, error: 'invalid_name', message: 'Nombre invalido' })
      return
    }
    const result = await leaderboardStore.createProfile({
      id: sanitizeProfileId(req.body?.id),
      name,
      avatar: normalizeAvatar(req.body?.avatar, name),
    })
    if (!result.profile) {
      res.status(503).json({ ok: false, error: 'profiles_unavailable', message: 'Perfiles no disponibles en este momento' })
      return
    }
    res.status(201).json({ ok: true, source: leaderboardStore.type, profile: result.profile })
  } catch (error) {
    res.status(500).json({ ok: false, error: 'profiles_create_failed', message: error.message })
  }
})
app.patch('/profiles/:profileId', async (req, res) => {
  try {
    const profileId = sanitizeProfileId(req.params.profileId)
    if (!profileId) {
      res.status(400).json({ ok: false, error: 'invalid_profile', message: 'Perfil invalido' })
      return
    }
    const name = req.body?.name == null ? undefined : sanitizeName(req.body.name)
    if (req.body?.name != null && !name) {
      res.status(400).json({ ok: false, error: 'invalid_name', message: 'Nombre invalido' })
      return
    }
    const result = await leaderboardStore.updateProfile(profileId, {
      name,
      avatar: req.body?.avatar == null ? undefined : normalizeAvatar(req.body.avatar, name || ''),
    })
    if (!result.profile) {
      res.status(503).json({ ok: false, error: 'profiles_unavailable', message: 'Perfiles no disponibles en este momento' })
      return
    }
    res.json({ ok: true, source: leaderboardStore.type, profile: result.profile })
  } catch (error) {
    res.status(500).json({ ok: false, error: 'profiles_update_failed', message: error.message })
  }
})
app.delete('/profiles/:profileId', async (req, res) => {
  try {
    const profileId = sanitizeProfileId(req.params.profileId)
    if (!profileId) {
      res.status(400).json({ ok: false, error: 'invalid_profile', message: 'Perfil invalido' })
      return
    }
    const result = await leaderboardStore.deleteProfile(profileId)
    if (result.available === false) {
      res.status(503).json({ ok: false, error: 'profiles_unavailable', message: 'Perfiles no disponibles en este momento' })
      return
    }
    res.json({ ok: true, source: leaderboardStore.type })
  } catch (error) {
    res.status(500).json({ ok: false, error: 'profiles_delete_failed', message: error.message })
  }
})
app.post('/match-results', async (req, res) => {
  try {
    const result = await leaderboardStore.recordMatchResult(req.body || {})
    res.json({ ok: true, source: leaderboardStore.type, ...result })
  } catch (error) {
    res.status(500).json({ ok: false, error: 'match_result_failed', message: error.message })
  }
})
app.get('/health', (_, res) => res.json({
  ok: true,
  rooms: rooms.size,
  roomStore: roomStore.type,
  leaderboardStore: leaderboardStore.type,
}))

app.get('/health/details', async (_, res) => res.json({
  ok: true,
  rooms: rooms.size,
  storedRooms: await roomStore.count(),
  roomStore: roomStore.type,
  leaderboardStore: leaderboardStore.type,
}))

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)
const playerIdGen = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)
const tokenGen = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 24)

function shuffleOrder(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function makeSpeakOrder(room) {
  return shuffleOrder(room.players.filter(p => !p.eliminated && !p.disconnected).map(p => p.id))
}

const rooms = new Map() // code -> active Room cache
const roomStore = createRoomStore()
const leaderboardStore = createLeaderboardStore()
const RECONNECT_GRACE_MS = 60_000
const ROOM_SCHEMA_VERSION = 1
const RECENT_WORD_LIMIT = 10
const CHAT_MESSAGE_LIMIT = 50
const CHAT_TEXT_MAX_LENGTH = 20
const IMPOSTOR_CHAT_MESSAGE_LIMIT = 50
const IMPOSTOR_CHAT_TEXT_MAX_LENGTH = 80
const CHAT_RATE_LIMIT = 20
const CHAT_RATE_WINDOW_MS = 60_000
const INTERROGATION_DURATION_MS = 30_000
const ALIBI_ROUND_OPTIONS = [3, 5, 7]
const ALIBI_POINTS = {
  correctAccusation: 3,
  detectiveCorrect: 4,
  honestCleared: 1,
  lieSurvived: 4,
  lieTied: 2,
}
const INTERROGATION_PROMPTS = [
  'Describe la palabra usando exactamente 3 palabras.',
  'Da una pista sin mencionar la categoria.',
  'Relaciona la palabra con una experiencia concreta.',
  'Menciona algo cercano a la palabra, sin decir la palabra.',
  'Da una pista que suene natural en una conversacion.',
  'Explica por que alguien reconoceria esta palabra.',
]
const ALIBI_INTERROGATION_PROMPTS = [
  'Reconstruye tu ruta desde {claimedLocation} hasta el momento del apagon.',
  'Di que podias ver desde {claimedLocation} sin agregar detalles nuevos.',
  'Explica que sonido escuchaste primero y de donde crees que venia.',
  'Responde por que tu ubicacion encaja con la evidencia publica.',
  'Nombra a una persona cuya version confirme o contradiga la tuya.',
  'Describe que hiciste en los 17 segundos del apagon.',
]

// --- rate limiting (token bucket por socket) ---
const buckets = new Map() // socketId -> { tokens, last }
const chatWindows = new Map() // socketId -> [timestamps]
const voiceSignalBuckets = new Map()
const voiceAudioBuckets = new Map()
const ipConnectionCounts = new Map()
const roomCreationWindows = new Map()
const BUCKET_MAX = 40
const BUCKET_REFILL_PER_SEC = 12
const VOICE_SIGNAL_BUCKET_MAX = 240
const VOICE_SIGNAL_REFILL_PER_SEC = 90
const VOICE_AUDIO_BUCKET_MAX = 45
const VOICE_AUDIO_REFILL_PER_SEC = 18
const VOICE_AUDIO_MAX_BYTES = 8192

function normalizeIp(raw) {
  let value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') value = String(value ?? '')
  value = value.trim()
  if (!value) return ''

  if (value.toLowerCase() === 'localhost') return '127.0.0.1'
  if (value.startsWith('[')) {
    const end = value.indexOf(']')
    if (end > 0) value = value.slice(1, end)
  }

  const ipv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/)
  if (ipv4WithPort) value = ipv4WithPort[1]

  const scopeIndex = value.indexOf('%')
  if (scopeIndex > -1) value = value.slice(0, scopeIndex)

  if (value.toLowerCase().startsWith('::ffff:')) value = value.slice(7)
  return value.trim()
}

function forwardedIp(headerValue, { preferLast = false } = {}) {
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue
  if (typeof value !== 'string') return ''
  const chain = value.split(',').map(item => item.trim()).filter(Boolean)
  return normalizeIp((preferLast ? chain.at(-1) : chain[0]) || '')
}

function getClientIpFromRequest(req) {
  return (
    normalizeIp(req.ip) ||
    forwardedIp(req.headers?.['x-forwarded-for'], { preferLast: true }) ||
    normalizeIp(req.socket?.remoteAddress)
  )
}

function getClientIpFromSocket(socket) {
  const headers = socket.handshake?.headers || {}
  return (
    forwardedIp(headers['x-forwarded-for'], { preferLast: true }) ||
    normalizeIp(socket.handshake?.address) ||
    normalizeIp(socket.conn?.remoteAddress) ||
    normalizeIp(socket.request?.socket?.remoteAddress)
  )
}

function isPrivateIpv4(ip) {
  const parts = ip.split('.').map(part => Number.parseInt(part, 10))
  if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) return false
  const [a, b] = parts
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 0)
  )
}

function isIpExempt(rawIp) {
  const ip = normalizeIp(rawIp).toLowerCase()
  if (!ip) return false
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1' || ip === '::') return true
  if (net.isIP(ip) === 4) return isPrivateIpv4(ip)
  if (net.isIP(ip) === 6) {
    return ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')
  }
  return false
}

function rateLimitKeyForIp(rawIp) {
  const ip = normalizeIp(rawIp)
  if (!ip) return 'unknown'
  return net.isIP(ip) ? ipKeyGenerator(ip) : ip
}

function releaseIpConnection(socket) {
  if (!socket.data?.ipConnectionTracked) return
  const key = socket.data.rateLimitIpKey
  const current = ipConnectionCounts.get(key) || 0
  if (current <= 1) ipConnectionCounts.delete(key)
  else ipConnectionCounts.set(key, current - 1)
  socket.data.ipConnectionTracked = false
}

function allowRoomCreationForIp(rawIp) {
  if (isIpExempt(rawIp)) return true
  const key = rateLimitKeyForIp(rawIp)
  const now = Date.now()
  const recent = (roomCreationWindows.get(key) || [])
    .filter(timestamp => now - timestamp < ROOM_CREATION_WINDOW_MS)
  if (recent.length >= MAX_ROOM_CREATIONS_PER_IP_PER_HOUR) {
    roomCreationWindows.set(key, recent)
    return false
  }
  recent.push(now)
  roomCreationWindows.set(key, recent)
  return true
}

function allow(socketId, cost = 1) {
  const now = Date.now()
  const b = buckets.get(socketId) || { tokens: BUCKET_MAX, last: now }
  const dt = (now - b.last) / 1000
  b.tokens = Math.min(BUCKET_MAX, b.tokens + dt * BUCKET_REFILL_PER_SEC)
  b.last = now
  if (b.tokens < cost) {
    buckets.set(socketId, b)
    return false
  }
  b.tokens -= cost
  buckets.set(socketId, b)
  return true
}

function allowBucket(map, socketId, max, refillPerSec, cost = 1) {
  const now = Date.now()
  const bucket = map.get(socketId) || { tokens: max, last: now }
  const dt = (now - bucket.last) / 1000
  bucket.tokens = Math.min(max, bucket.tokens + dt * refillPerSec)
  bucket.last = now
  if (bucket.tokens < cost) {
    map.set(socketId, bucket)
    return false
  }
  bucket.tokens -= cost
  map.set(socketId, bucket)
  return true
}

function allowVoiceSignal(socketId) {
  return allowBucket(voiceSignalBuckets, socketId, VOICE_SIGNAL_BUCKET_MAX, VOICE_SIGNAL_REFILL_PER_SEC)
}

function allowVoiceAudio(socketId) {
  return allowBucket(voiceAudioBuckets, socketId, VOICE_AUDIO_BUCKET_MAX, VOICE_AUDIO_REFILL_PER_SEC)
}

function allowChatMessage(socketId) {
  const now = Date.now()
  const recent = (chatWindows.get(socketId) || [])
    .filter(timestamp => now - timestamp < CHAT_RATE_WINDOW_MS)
  if (recent.length >= CHAT_RATE_LIMIT) {
    chatWindows.set(socketId, recent)
    return false
  }
  recent.push(now)
  chatWindows.set(socketId, recent)
  return true
}

// --- helpers de validación ---
function sanitizeName(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, 16)
}
function sanitizeProfileId(raw) {
  if (typeof raw !== 'string') return null
  const clean = raw.trim()
  return /^[0-9a-fA-F-]{36}$/.test(clean) ? clean.toLowerCase() : null
}

function sanitizePlayerProfile({ profileId, isGuest } = {}) {
  const cleanProfileId = sanitizeProfileId(profileId)
  const guest = isGuest !== false || !cleanProfileId
  return {
    profileId: guest ? null : cleanProfileId,
    isGuest: guest,
  }
}
function sanitizeChatText(raw, maxLength = CHAT_TEXT_MAX_LENGTH) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}
function sanitizeImpostorChatText(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, IMPOSTOR_CHAT_TEXT_MAX_LENGTH)
}
function isValidCode(s) {
  return typeof s === 'string' && /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/i.test(s)
}
function isValidSessionToken(s) {
  return typeof s === 'string' && /^[0-9A-Za-z]{24}$/.test(s)
}
function isAlibiConfig(config) {
  return config?.gameType === 'alibi' || config?.mode === 'alibi'
}
function isPartyLineConfig(config) {
  return config?.gameType === 'partyline' || config?.mode === 'partyline'
}
function sanitizeConfig(cfg) {
  const out = {}
  if (typeof cfg !== 'object' || !cfg) return out
  const requestedAlibi = cfg.gameType === 'alibi' || cfg.mode === 'alibi'
  const requestedPartyLine = cfg.gameType === 'partyline' || cfg.mode === 'partyline'
  if (requestedPartyLine) {
    out.gameType = 'partyline'
    out.mode = 'partyline'
  } else if (requestedAlibi) {
    out.gameType = 'alibi'
    out.mode = 'alibi'
  } else {
    if (cfg.gameType === 'impostor') out.gameType = 'impostor'
    if (typeof cfg.mode === 'string' && ['classic', 'clue', 'blind'].includes(cfg.mode)) out.mode = cfg.mode
  }
  if (typeof cfg.category === 'string' && (cfg.category === 'random' || wordBank[cfg.category])) out.category = cfg.category
  if (Number.isFinite(cfg.impostorCount)) out.impostorCount = Math.max(1, Math.floor(cfg.impostorCount))
  if (typeof cfg.clueType === 'string' && ['category','firstLetter','wordLength','vague','custom'].includes(cfg.clueType)) out.clueType = cfg.clueType
  if (typeof cfg.customClue === 'string') out.customClue = cfg.customClue.slice(0, 80)
  if (typeof cfg.blindIntensity === 'string' && ['near','medium','far'].includes(cfg.blindIntensity)) out.blindIntensity = cfg.blindIntensity
  if (typeof cfg.roundTime === 'string') out.roundTime = cfg.roundTime
  if (Number.isFinite(cfg.alibiRounds)) {
    const rounds = Math.floor(cfg.alibiRounds)
    out.alibiRounds = ALIBI_ROUND_OPTIONS.includes(rounds) ? rounds : 3
  }
  if (Number.isFinite(cfg.partyLineRounds)) {
    const rounds = Math.floor(cfg.partyLineRounds)
    out.partyLineRounds = PARTYLINE_ROUND_OPTIONS.includes(rounds) ? rounds : 5
  }
  if (Array.isArray(cfg.partyLineGames)) {
    out.partyLineGames = cfg.partyLineGames.filter(id => PARTYLINE_GAME_IDS.includes(id))
  }
  if (cfg.partyLineSettings && typeof cfg.partyLineSettings === 'object') {
    out.partyLineSettings = sanitizePartyLineConfig(cfg).partyLineSettings
  }
  if (typeof cfg.detectiveEnabled === 'boolean') out.detectiveEnabled = cfg.detectiveEnabled
  return out
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickWithout(arr, exclude) {
  const filtered = arr.filter(x => x !== exclude)
  return pickOne(filtered.length ? filtered : arr)
}

function normalizeWordKey(word) {
  return String(word ?? '').trim().toLowerCase()
}

function appendRecentWord(recentWords = [], word, limit = RECENT_WORD_LIMIT) {
  const wordKey = normalizeWordKey(word)
  const current = Array.isArray(recentWords) ? recentWords : []
  if (!wordKey) return current.slice(-limit)

  const withoutCurrentWord = current.filter(item => normalizeWordKey(item) !== wordKey)
  return [...withoutCurrentWord, word].slice(-limit)
}

function pickWordAvoidingRecent(words, recentWords = []) {
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

function buildClue(word, catKey, type, customClue) {
  switch (type) {
    case 'category':    return categories[catKey]?.label || catKey
    case 'firstLetter': return `Empieza con "${word.charAt(0).toUpperCase()}"`
    case 'wordLength':  return `Tiene ${word.replace(/\s/g, '').length} letras`
    case 'vague':       return vagueDefinition(catKey)
    case 'custom':      return customClue || '—'
    default:            return categories[catKey]?.label || catKey
  }
}

function vagueDefinition(catKey) {
  const map = {
    animales: 'Un ser vivo',
    comida: 'Algo que se come',
    lugares: 'Un lugar fisico',
    objetos: 'Algo que se puede tocar',
    peliculas: 'Una historia narrada',
    deportes: 'Una actividad fisica',
    profesiones: 'Algo que hace una persona',
    emociones: 'Un sentimiento',
    naturaleza: 'Un fenomeno natural',
    tecnologia: 'Algo moderno',
    historia: 'Algo del pasado',
    misterio: 'Algo inexplicable',
    colombia: 'Algo tipicamente colombiano',
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

function pickFakeWord(realWord, catKey, intensity) {
  const related = relatedWords[catKey]?.[realWord]
  if (related && related.length) {
    if (intensity === 'near') return related[0]
    if (intensity === 'far') return related[2] || related[related.length - 1]
    return related[1] || related[0]
  }
  if (intensity === 'far') {
    const otherCats = Object.keys(wordBank).filter(c => c !== catKey)
    return pickOne(wordBank[pickOne(otherCats)])
  }
  return pickWithout(wordBank[catKey], realWord)
}

function serializeRoom(room) {
  return {
    schemaVersion: ROOM_SCHEMA_VERSION,
    code: room.code,
    hostId: room.hostId,
    config: room.config,
    players: room.players.map(player => ({
      id: player.id,
      sessionToken: player.sessionToken,
      name: player.name,
      avatar: normalizeAvatar(player.avatar, player.name),
      profileId: player.profileId || null,
      isGuest: player.isGuest !== false || !player.profileId,
      isHost: player.isHost,
      ready: !!player.ready,
      eliminated: !!player.eliminated,
      disconnected: !!player.disconnected,
      disconnectedAt: player.disconnectedAt || null,
      disconnectExpiresAt: player.disconnectExpiresAt || null,
    })),
    phase: room.phase,
    round: room.round,
    votes: room.votes || {},
    voters: room.voters || {},
    eliminatedIds: room.eliminatedIds || [],
    word: room.word,
    fakeWord: room.fakeWord,
    clue: room.clue,
    category: room.category,
    recentWords: room.recentWords || [],
    gameCounter: room.gameCounter || 0,
    gameId: room.gameId,
    chatMessages: room.chatMessages || [],
    impostorChatMessages: room.impostorChatMessages || [],
    roles: room.roles || {},
    detectiveInterrogationUsedBy: room.detectiveInterrogationUsedBy || null,
    interrogation: room.interrogation || null,
    impostorGuessedWord: !!room.impostorGuessedWord,
    impostorLastGuessRound: Number.isFinite(room.impostorLastGuessRound) ? room.impostorLastGuessRound : -1,
    lastGuessRounds: room.lastGuessRounds || {},
    speakOrder: room.speakOrder || [],
    lastTie: room.lastTie || null,
    result: room.result || null,
    roomScores: room.roomScores || {},
    alibi: room.alibi || null,
    alibiScores: room.alibiScores || {},
    partyLine: room.partyLine || null,
    partyLineCalls: room.partyLineCalls || [],
    updatedAt: Date.now(),
  }
}

function restoreRoom(snapshot) {
  const now = Date.now()
  const phase = snapshot?.phase || 'lobby'
  const players = (Array.isArray(snapshot?.players) ? snapshot.players : [])
    .filter(player => player?.id && player?.sessionToken && player?.name)
    .filter(player => !(
      player.disconnected &&
      player.disconnectExpiresAt &&
      player.disconnectExpiresAt <= now
    ))
    .map(player => {
      const staleAfterRestart = phase !== 'ended' && !player.disconnected
      const disconnected = !!player.disconnected || staleAfterRestart
      const playerProfile = sanitizePlayerProfile(player)
      return {
        id: player.id,
        socketId: null,
        sessionToken: player.sessionToken,
        name: sanitizeName(player.name),
        avatar: normalizeAvatar(player.avatar, player.name),
        profileId: playerProfile.profileId,
        isGuest: playerProfile.isGuest,
        isHost: !!player.isHost,
        ready: !!player.ready,
        eliminated: !!player.eliminated,
        disconnected,
        disconnectedAt: disconnected ? (player.disconnectedAt || now) : null,
        disconnectExpiresAt: disconnected
          ? (player.disconnectExpiresAt || now + RECONNECT_GRACE_MS)
          : null,
      }
    })

  const room = {
    code: snapshot.code,
    hostId: snapshot.hostId,
    config: { ...sanitizeConfig(snapshot.config || {}) },
    players,
    phase,
    round: Number.isFinite(snapshot.round) ? snapshot.round : 1,
    votes: snapshot.votes || {},
    voters: snapshot.voters || {},
    eliminatedIds: Array.isArray(snapshot.eliminatedIds) ? snapshot.eliminatedIds : [],
    word: snapshot.word || null,
    fakeWord: snapshot.fakeWord || null,
    clue: snapshot.clue || null,
    category: snapshot.category || null,
    recentWords: Array.isArray(snapshot.recentWords) ? snapshot.recentWords : [],
    gameCounter: Number.isFinite(snapshot.gameCounter) ? snapshot.gameCounter : 0,
    gameId: snapshot.gameId || null,
    chatMessages: Array.isArray(snapshot.chatMessages) ? snapshot.chatMessages.slice(-CHAT_MESSAGE_LIMIT) : [],
    impostorChatMessages: Array.isArray(snapshot.impostorChatMessages) ? snapshot.impostorChatMessages.slice(-IMPOSTOR_CHAT_MESSAGE_LIMIT) : [],
    roles: snapshot.roles || {},
    detectiveInterrogationUsedBy: snapshot.detectiveInterrogationUsedBy || null,
    interrogation: snapshot.interrogation?.expiresAt > now ? snapshot.interrogation : null,
    interrogationTimer: null,
    impostorGuessedWord: !!snapshot.impostorGuessedWord,
    impostorLastGuessRound: Number.isFinite(snapshot.impostorLastGuessRound) ? snapshot.impostorLastGuessRound : -1,
    lastGuessRounds: snapshot.lastGuessRounds || {},
    disconnectTimers: {},
    voicePeers: new Set(),
    speakOrder: Array.isArray(snapshot.speakOrder) ? snapshot.speakOrder : [],
    lastTie: snapshot.lastTie || null,
    result: snapshot.result || null,
    roomScores: snapshot.roomScores || {},
    alibi: snapshot.alibi || null,
    alibiScores: snapshot.alibiScores || {},
    partyLine: snapshot.partyLine || null,
    partyLineCalls: [],
  }
  if (room.players.some(player => player.id === room.hostId)) {
    syncHostFlags(room)
  } else {
    assignHost(room)
  }
  recalculateVotes(room)
  return room
}

async function persistRoom(room) {
  if (!room?.code) return
  await roomStore.set(room.code, serializeRoom(room))
}

function saveRoom(room) {
  persistRoom(room).catch(error => {
    console.warn(`[room-store] Could not persist room ${room?.code || ''}: ${error.message}`)
  })
}

async function deleteRoom(code) {
  const normalizedCode = typeof code === 'string' ? code : code?.code
  if (!normalizedCode) return
  const room = rooms.get(normalizedCode)
  if (room?.interrogationTimer) clearTimeout(room.interrogationTimer)
  Object.values(room?.disconnectTimers || {}).forEach(clearTimeout)
  rooms.delete(normalizedCode)
  await roomStore.delete(normalizedCode)
}

function removeRoom(code) {
  deleteRoom(code).catch(error => {
    console.warn(`[room-store] Could not delete room ${typeof code === 'string' ? code : code?.code || ''}: ${error.message}`)
  })
}

function scheduleInterrogationTimer(room) {
  if (room.interrogationTimer) {
    clearTimeout(room.interrogationTimer)
    room.interrogationTimer = null
  }
  if (!room.interrogation?.expiresAt) return

  const delay = room.interrogation.expiresAt - Date.now()
  if (delay <= 0) {
    clearInterrogation(room)
    saveRoom(room)
    return
  }

  room.interrogationTimer = setTimeout(() => {
    clearInterrogation(room)
    saveRoom(room)
  }, delay)
}

function scheduleDisconnectTimer(room, player) {
  if (!room?.code || !player?.id || !player.disconnected) return
  if (room.disconnectTimers[player.id]) clearTimeout(room.disconnectTimers[player.id])
  const expiresAt = player.disconnectExpiresAt || Date.now() + RECONNECT_GRACE_MS
  player.disconnectExpiresAt = expiresAt
  const delay = Math.max(0, expiresAt - Date.now())
  room.disconnectTimers[player.id] = setTimeout(() => {
    pruneDisconnectedPlayer(room, player.id)
  }, delay)
}

function scheduleRoomTimers(room) {
  scheduleInterrogationTimer(room)
  room.players
    .filter(player => player.disconnected)
    .forEach(player => scheduleDisconnectTimer(room, player))
}

function pruneDisconnectedPlayer(room, playerId) {
  delete room.disconnectTimers[playerId]
  const stillThere = room.players.find(p => p.id === playerId)
  if (!stillThere || !stillThere.disconnected) return

  const wasActiveGame = room.phase !== 'lobby' && room.phase !== 'ended'
  room.players = room.players.filter(p => p.id !== playerId)
  delete room.roles[playerId]
  delete room.voters[playerId]
  delete room.votes[playerId]
  delete room.lastGuessRounds[playerId]
  room.speakOrder = (room.speakOrder || []).filter(id => id !== playerId)
  const callsChanged = endPartyLineCallsFor(room, playerId)
  if (room.interrogation && (room.interrogation.detectiveId === playerId || room.interrogation.targetId === playerId)) {
    clearInterrogation(room)
  }
  if (!room.players.length) {
    clearInterrogation(room, { emit: false })
    removeRoom(room.code)
    return
  }
  const hostChanged = room.hostId === playerId
  const newHost = assignHost(room)
  broadcastPlayers(room)
  if (callsChanged) emitPartyLineCalls(room)
  if (hostChanged) notifyHostAssigned(room, newHost)
  if (wasActiveGame) afterPlayerListChanged(room)
  saveRoom(room)
}

async function getRoomByCode(code) {
  if (!isValidCode(code)) return null
  const normalizedCode = code.toUpperCase()
  const cached = rooms.get(normalizedCode)
  if (cached) return cached

  const snapshot = await roomStore.get(normalizedCode)
  if (!snapshot?.code) return null
  const room = restoreRoom(snapshot)
  if (!room.players.length) {
    await deleteRoom(normalizedCode)
    return null
  }
  rooms.set(normalizedCode, room)
  scheduleRoomTimers(room)
  saveRoom(room)
  return room
}

async function newCode() {
  let code
  let tries = 0
  do {
    code = codeGen()
    tries++
  } while ((rooms.has(code) || await roomStore.has(code)) && tries < 20)
  return code
}

async function makeRoom(hostSocketId, hostName, avatar, config, profile = {}) {
  const code = await newCode()
  const playerProfile = sanitizePlayerProfile(profile)
  const player = {
    id: playerIdGen(), socketId: hostSocketId,
    sessionToken: tokenGen(),
    name: hostName, avatar: normalizeAvatar(avatar, hostName),
    profileId: playerProfile.profileId,
    isGuest: playerProfile.isGuest,
    isHost: true, ready: false, eliminated: false, disconnected: false,
    disconnectedAt: null, disconnectExpiresAt: null,
  }
  const room = {
    code, hostId: player.id,
    config: { gameType: 'impostor', mode: 'classic', category: 'random', impostorCount: 1, ...sanitizeConfig(config) },
    players: [player],
    phase: 'lobby',
    round: 1,
    votes: {},
    voters: {},
    eliminatedIds: [],
    word: null, fakeWord: null, clue: null, category: null,
    recentWords: [],
    gameCounter: 0,
    gameId: null,
    chatMessages: [],
    impostorChatMessages: [],
    roles: {},
    detectiveInterrogationUsedBy: null,
    interrogation: null,
    interrogationTimer: null,
    impostorGuessedWord: false,
    impostorLastGuessRound: -1,
    lastGuessRounds: {},   // socketId -> última ronda en que intentó adivinar
    disconnectTimers: {},   // playerId -> timeout
    voicePeers: new Set(),  // playerIds con chat de voz activo
    speakOrder: [],
    lastTie: null,
    result: null,
    roomScores: {},
    alibi: null,
    alibiScores: {},
    partyLine: null,
    partyLineCalls: [],
  }
  rooms.set(code, room)
  return room
}

function interrogationPayloadFor(interrogation, viewerId = null) {
  if (!interrogation) return null
  const canSeePrompt = viewerId === interrogation.detectiveId || viewerId === interrogation.targetId
  const payload = {
    id: interrogation.id,
    detectiveId: interrogation.detectiveId,
    detectiveName: interrogation.detectiveName,
    detectiveAvatar: interrogation.detectiveAvatar,
    targetId: interrogation.targetId,
    targetName: interrogation.targetName,
    targetAvatar: interrogation.targetAvatar,
    startedAt: interrogation.startedAt,
    expiresAt: interrogation.expiresAt,
  }
  if (canSeePrompt) payload.prompt = interrogation.prompt
  return payload
}

function sanitizeRoom(room, viewerId = null) {
  return {
    code: room.code,
    config: room.config,
    players: room.players.map(p => ({
      id: p.id, name: p.name, avatar: normalizeAvatar(p.avatar, p.name),
      profileId: p.profileId || null,
      isGuest: p.isGuest !== false || !p.profileId,
      isHost: p.isHost, ready: p.ready,
      eliminated: p.eliminated, disconnected: !!p.disconnected,
    })),
    phase: room.phase, round: room.round,
    votes: room.votes || {},
    votersReady: Object.keys(room.voters || {}).length,
    votedPlayerIds: Object.keys(room.voters || {}),
    speakOrder: room.speakOrder || [],
    lastTie: room.lastTie || null,
    result: room.result || null,
    chatMessages: room.chatMessages,
    impostorChatMessages: impostorChatMessagesFor(room, viewerId),
    impostorLastGuessRound: canUseImpostorChat(room, viewerId) ? (room.impostorLastGuessRound ?? -1) : -1,
    interrogation: interrogationPayloadFor(room.interrogation, viewerId),
    alibiCase: publicAlibiCase(room),
    alibiRoundResult: room.alibi?.roundResult || null,
    alibiScoreboard: alibiScoreboard(room),
    partyLine: publicPartyLineSummary(room),
    partyLineRound: publicPartyLineRound(room),
    partyLineResult: room.partyLine?.roundResult || null,
    partyLineScoreboard: partyLineScoreboard(room),
    partyLineCalls: publicPartyLineCalls(room),
  }
}

function privatePlayerPayload(player) {
  return {
    id: player.id,
    name: player.name,
    avatar: normalizeAvatar(player.avatar, player.name),
    profileId: player.profileId || null,
    isGuest: player.isGuest !== false || !player.profileId,
    isHost: player.isHost,
    sessionToken: player.sessionToken,
  }
}

function chatPayloadFor(player, text) {
  return {
    id: `${Date.now()}-${player.id}-${Math.random().toString(36).slice(2, 8)}`,
    playerId: player.id,
    name: player.name,
    avatar: normalizeAvatar(player.avatar, player.name),
    text,
    createdAt: Date.now(),
  }
}

function isDetectiveRole(role) {
  return role === 'detective' || role === 'detective-impostor' || role === 'detective-blind'
}

function isImpostorRole(role) {
  return role === 'impostor' || role === 'detective-impostor'
}

function isCitizenTeamRole(role) {
  return role === 'citizen' || role === 'detective' || role === 'detective-blind'
}

function canUseImpostorChat(room, playerId) {
  if (!room || !playerId || room.config?.mode === 'blind') return false
  const player = room.players.find(item => item.id === playerId)
  if (!player || player.eliminated || player.disconnected) return false
  return isImpostorRole(room.roles[playerId])
}

function impostorChatMessagesFor(room, playerId) {
  return canUseImpostorChat(room, playerId)
    ? (room.impostorChatMessages || []).slice(-IMPOSTOR_CHAT_MESSAGE_LIMIT)
    : []
}

function emitToConsciousImpostors(room, event, payload) {
  room.players.forEach(player => {
    if (!player.socketId || player.disconnected || !canUseImpostorChat(room, player.id)) return
    io.to(player.socketId).emit(event, payload)
  })
}

function canGuessWord(room, playerId) {
  if (!room || room.config?.mode === 'blind') return false
  return isImpostorRole(room.roles[playerId])
}

function clearInterrogation(room, { emit = true } = {}) {
  const current = room.interrogation
  if (room.interrogationTimer) {
    clearTimeout(room.interrogationTimer)
    room.interrogationTimer = null
  }
  room.interrogation = null
  if (emit && current) {
    io.to(room.code).emit('game:interrogationEnded', { id: current.id })
  }
  if (current) saveRoom(room)
}

function buildInterrogationPayload(room, detective, target) {
  const now = Date.now()
  const assignment = room.alibi?.assignments?.[target.id]
  const prompt = isAlibiConfig(room.config)
    ? formatTemplate(pickOne(ALIBI_INTERROGATION_PROMPTS), {
        targetName: target.name,
        claimedLocation: assignment?.claimedLocation || 'tu ubicacion',
      })
    : pickOne(INTERROGATION_PROMPTS)
  return {
    id: `${room.gameId || room.code}-${now}`,
    detectiveId: detective.id,
    detectiveName: detective.name,
    detectiveAvatar: normalizeAvatar(detective.avatar, detective.name),
    targetId: target.id,
    targetName: target.name,
    targetAvatar: normalizeAvatar(target.avatar, target.name),
    prompt,
    startedAt: now,
    expiresAt: now + INTERROGATION_DURATION_MS,
  }
}

function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.socketId === socketId)) return room
  }
  return null
}

function getPlayerBySocket(room, socketId) {
  return room?.players.find(p => p.socketId === socketId) || null
}

function sanitizeVoiceSignal(signal) {
  if (!signal || typeof signal !== 'object') return null
  if (signal.type === 'offer' || signal.type === 'answer') {
    if (typeof signal.sdp !== 'string') return null
    return { type: signal.type, sdp: signal.sdp }
  }
  if (signal.type === 'ice-candidate') {
    if (!signal.candidate || typeof signal.candidate !== 'object') return null
    return { type: 'ice-candidate', candidate: signal.candidate }
  }
  return null
}

function sanitizeVoiceAudioPayload(payload) {
  if (!payload || typeof payload !== 'object') return null
  const rawAudio = payload.audio
  let audio = null
  if (Buffer.isBuffer(rawAudio)) audio = rawAudio
  else if (rawAudio instanceof ArrayBuffer) audio = Buffer.from(rawAudio)
  else if (ArrayBuffer.isView(rawAudio)) {
    audio = Buffer.from(rawAudio.buffer, rawAudio.byteOffset, rawAudio.byteLength)
  }
  if (!audio || audio.length < 2 || audio.length > VOICE_AUDIO_MAX_BYTES || audio.length % 2 !== 0) return null

  const sampleRate = Math.round(Number(payload.sampleRate) || 16000)
  if (sampleRate < 8000 || sampleRate > 48000) return null

  const sequence = Number.isFinite(Number(payload.sequence))
    ? Math.max(0, Math.floor(Number(payload.sequence)))
    : 0
  return { audio, sampleRate, sequence }
}

function removeVoicePeer(playerId, room = null) {
  const targetRoom = room || [...rooms.values()].find(candidate => candidate.voicePeers?.has(playerId))
  if (!targetRoom?.voicePeers?.has(playerId)) return
  targetRoom.voicePeers.delete(playerId)
  targetRoom.voicePeers.forEach(peerId => {
    const peer = targetRoom.players.find(p => p.id === peerId && !p.disconnected)
    if (peer?.socketId) io.to(peer.socketId).emit('voice:peerLeft', { peerId: playerId })
  })
}

function publicPartyLineCalls(room) {
  if (!room?.partyLineCalls?.length) return []
  return room.partyLineCalls
    .filter(call => call?.status === 'ringing' || call?.status === 'active')
    .map(call => {
      const caller = room.players.find(player => player.id === call.callerId)
      const target = room.players.find(player => player.id === call.targetId)
      return {
        id: call.id,
        status: call.status,
        callerId: call.callerId,
        callerName: caller?.name || call.callerName || 'Jugador',
        callerAvatar: normalizeAvatar(caller?.avatar || call.callerAvatar, caller?.name || call.callerName),
        targetId: call.targetId,
        targetName: target?.name || call.targetName || 'Jugador',
        targetAvatar: normalizeAvatar(target?.avatar || call.targetAvatar, target?.name || call.targetName),
        startedAt: call.startedAt,
        updatedAt: call.updatedAt,
      }
    })
}

function emitPartyLineCalls(room) {
  io.to(room.code).emit('partyline:calls', { calls: publicPartyLineCalls(room) })
}

function clearPartyLineCalls(room, { emit = true } = {}) {
  if (!room?.partyLineCalls?.length) return
  room.partyLineCalls = []
  if (emit) emitPartyLineCalls(room)
}

function partyLineActiveCallFor(room, playerId) {
  return (room?.partyLineCalls || []).find(call => (
    call.status === 'active' &&
    (call.callerId === playerId || call.targetId === playerId)
  )) || null
}

function partyLineOutgoingCallFor(room, playerId) {
  return (room?.partyLineCalls || []).find(call => (
    call.status === 'ringing' && call.callerId === playerId
  )) || null
}

function partyLineIncomingCallFor(room, playerId) {
  return (room?.partyLineCalls || []).find(call => (
    call.status === 'ringing' && call.targetId === playerId
  )) || null
}

function isPartyLineCallerBusy(room, playerId) {
  return !!partyLineActiveCallFor(room, playerId) || !!partyLineOutgoingCallFor(room, playerId)
}

function isPartyLineTargetBusy(room, playerId) {
  return !!partyLineActiveCallFor(room, playerId) ||
    !!partyLineOutgoingCallFor(room, playerId) ||
    !!partyLineIncomingCallFor(room, playerId)
}

function declineIncomingCallsFor(room, targetId) {
  const before = room.partyLineCalls?.length || 0
  room.partyLineCalls = (room.partyLineCalls || []).filter(call => !(
    call.status === 'ringing' && call.targetId === targetId
  ))
  return before !== room.partyLineCalls.length
}

function endPartyLineCallsFor(room, playerId) {
  const before = room.partyLineCalls?.length || 0
  room.partyLineCalls = (room.partyLineCalls || []).filter(call => (
    call.callerId !== playerId && call.targetId !== playerId
  ))
  return before !== room.partyLineCalls.length
}

function partyLineVoicePeerAllowed(room, fromId, toId) {
  if (!isPartyLineConfig(room?.config)) return true
  if (room.phase === 'lobby') return true
  if (room.phase !== 'partyRound') return false
  const call = partyLineActiveCallFor(room, fromId)
  if (!call) return false
  return (call.callerId === toId || call.targetId === toId)
}

function formatTemplate(template, values) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')
}

function publicAlibiCase(room) {
  if (!room?.alibi?.currentCase) return null
  const current = room.alibi.currentCase
  const detective = room.players.find(player => player.id === room.alibi?.detectiveId)
  return {
    round: room.round,
    totalRounds: room.alibi.totalRounds || 3,
    id: current.id,
    title: current.title,
    subtitle: current.subtitle || '',
    chapterLabel: current.chapterLabel || '',
    brief: current.brief,
    premise: current.premise || '',
    objective: current.objective || '',
    roundPrompt: current.roundPrompt || '',
    howToPlay: current.howToPlay || [],
    story: current.story || [],
    victim: current.victim || null,
    incident: current.incident || null,
    evidence: current.evidence || current.publicEvidence?.[0] || '',
    publicEvidence: current.publicEvidence || [],
    tableQuestions: current.tableQuestions || [],
    map: current.map || null,
    locations: current.locations || [],
    detective: detective ? {
      id: detective.id,
      name: detective.name,
      avatar: normalizeAvatar(detective.avatar, detective.name),
    } : null,
  }
}

function alibiAssignmentFor(room, playerId) {
  if (room?.alibi?.detectiveId === playerId) {
    const current = room.alibi.currentCase
    return {
      ...publicAlibiCase(room),
      role: 'alibi-detective',
      objective: 'Dirige la investigacion, interroga sospechosos y emite la acusacion final.',
      statement: current?.detectiveBrief || 'Usa el mapa, las evidencias y las versiones privadas que escuches para encontrar la coartada falsa.',
      clue: current?.detectiveTip || 'No busques una confesion. Busca una ruta imposible, un sonido mal ubicado o una version demasiado larga.',
      suspects: room.players
        .filter(player => room.alibi?.assignments?.[player.id])
        .map(player => ({
          id: player.id,
          name: player.name,
          avatar: normalizeAvatar(player.avatar, player.name),
        })),
    }
  }
  const assignment = room?.alibi?.assignments?.[playerId]
  if (!assignment) return null
  return {
    ...publicAlibiCase(room),
    role: assignment.role,
    realLocation: assignment.realLocation,
    claimedLocation: assignment.claimedLocation,
    statement: assignment.statement,
    saw: assignment.saw,
    heard: assignment.heard,
    detail: assignment.detail,
    risk: assignment.risk,
    clue: assignment.clue,
    objective: assignment.objective,
  }
}

function emptyAlibiScore(player) {
  return {
    playerId: player.id,
    name: player.name,
    avatar: normalizeAvatar(player.avatar, player.name),
    profileId: player.profileId || null,
    isGuest: player.isGuest !== false || !player.profileId,
    totalPoints: 0,
    correctAccusations: 0,
    liesSurvived: 0,
    rounds: 0,
    lastDelta: 0,
  }
}

function alibiScoreboard(room) {
  return Object.values(room.alibiScores || {})
    .sort((a, b) => (
      b.totalPoints - a.totalPoints ||
      b.correctAccusations - a.correctAccusations ||
      a.name.localeCompare(b.name)
    ))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function createAlibiRound(room) {
  const players = room.players.filter(player => !player.disconnected)
  if (players.length < 3) return
  const currentCase = room.alibi?.caseFile || pickOne(alibiCases)
  let detective = players.find(player => player.id === room.alibi?.detectiveId)
  if (!detective) detective = pickOne(players)
  const suspects = players.filter(player => player.id !== detective.id)
  if (suspects.length < 2) return
  const liar = pickOne(suspects)
  const locationPool = shuffle(currentCase.locations)
  const realLocations = new Map()
  suspects.forEach((player, index) => {
    realLocations.set(player.id, locationPool[index % locationPool.length])
  })
  const reservedRealLocations = new Set(realLocations.values())
  const assignments = {}

  room.roles = {}
  room.roles[detective.id] = 'detective'

  suspects.forEach((player) => {
    const realLocation = realLocations.get(player.id)
    const role = player.id === liar.id ? 'alibi-liar' : 'alibi-witness'
    const falseLocationPool = currentCase.locations.filter(location => (
      location !== realLocation && !reservedRealLocations.has(location)
    ))
    const claimedLocation = role === 'alibi-liar'
      ? pickOne(falseLocationPool.length ? falseLocationPool : currentCase.locations.filter(location => location !== realLocation))
      : realLocation
    const other = pickOne(suspects.filter(item => item.id !== player.id)) || player
    const clueTemplates = role === 'alibi-liar' ? currentCase.liarHints : currentCase.clues
    const version = currentCase.versions?.[claimedLocation] || {}
    const clue = formatTemplate(pickOne(clueTemplates), {
      liarName: liar.name,
      liarClaim: claimedLocation,
      otherName: other.name,
    })

    assignments[player.id] = {
      role,
      realLocation,
      claimedLocation,
      statement: version.statement || currentCase.statements[claimedLocation] || `Estaba en ${claimedLocation}.`,
      saw: version.saw || '',
      heard: version.heard || '',
      detail: version.detail || '',
      risk: version.risk || '',
      clue,
      objective: role === 'alibi-liar'
        ? 'Defiende tu version falsa y evita que el Detective te acuse.'
        : 'Ayuda al Detective a encontrar quien sostiene una coartada falsa.',
    }
    room.roles[player.id] = role
  })

  room.alibi = {
    ...(room.alibi || {}),
    totalRounds: ALIBI_ROUND_OPTIONS.includes(Number(room.config?.alibiRounds)) ? Number(room.config.alibiRounds) : 3,
    caseFile: currentCase,
    currentCase,
    detectiveId: detective.id,
    liarId: liar.id,
    assignments,
    roundResult: null,
    history: room.alibi?.history || [],
  }
}

function resetAlibiGame(room) {
  room.roles = {}
  room.alibiScores = {}
  room.alibi = {
    totalRounds: ALIBI_ROUND_OPTIONS.includes(Number(room.config?.alibiRounds)) ? Number(room.config.alibiRounds) : 3,
    caseFile: pickOne(alibiCases),
    currentCase: null,
    detectiveId: null,
    liarId: null,
    assignments: {},
    roundResult: null,
    history: [],
  }
  createAlibiRound(room)
}

function alibiVoteResult(room) {
  const roundPlayers = room.players.filter(player => (
    room.alibi?.assignments?.[player.id] || player.id === room.alibi?.detectiveId
  ))
  const suspects = room.players.filter(player => room.alibi?.assignments?.[player.id])
  const counts = room.votes || {}
  const detectiveId = room.alibi?.detectiveId
  const detective = room.players.find(player => player.id === detectiveId)
  const accusedId = room.voters[detectiveId] || null
  const leaderIds = accusedId ? [accusedId] : []
  const liarId = room.alibi?.liarId
  const liar = room.players.find(player => player.id === liarId)
  const liarAssignment = room.alibi?.assignments?.[liarId] || null
  const detected = accusedId === liarId
  const tiedWithLiar = false
  const pointRows = []

  roundPlayers.forEach(player => {
    const previous = room.alibiScores[player.id] || emptyAlibiScore(player)
    const isDetective = player.id === detectiveId
    const votedCorrectly = isDetective && detected
    const isLiar = player.id === liarId
    const isHonestSuspect = !!room.alibi?.assignments?.[player.id] && !isLiar
    const breakdown = []
    if (isDetective && detected) breakdown.push({ label: 'Detective acerto', points: ALIBI_POINTS.detectiveCorrect })
    if (isHonestSuspect && detected) breakdown.push({ label: 'Coartada validada', points: ALIBI_POINTS.honestCleared })
    if (isLiar && !detected) {
      breakdown.push({
        label: 'Engano al detective',
        points: ALIBI_POINTS.lieSurvived,
      })
    }
    const delta = breakdown.reduce((total, item) => total + item.points, 0)
    const next = {
      ...previous,
      playerId: player.id,
      name: player.name,
      avatar: normalizeAvatar(player.avatar, player.name),
      profileId: player.profileId || null,
      isGuest: player.isGuest !== false || !player.profileId,
      totalPoints: previous.totalPoints + delta,
      correctAccusations: previous.correctAccusations + (votedCorrectly ? 1 : 0),
      liesSurvived: previous.liesSurvived + (isLiar && !detected ? 1 : 0),
      rounds: previous.rounds + 1,
      lastDelta: delta,
    }
    room.alibiScores[player.id] = next
    pointRows.push({
      playerId: player.id,
      name: player.name,
      avatar: normalizeAvatar(player.avatar, player.name),
      isLiar,
      isDetective,
      votedCorrectly,
      votedFor: isDetective ? accusedId : null,
      points: delta,
      totalPoints: next.totalPoints,
      breakdown,
    })
  })

  const voteCounts = suspects.map(player => ({
    playerId: player.id,
    name: player.name,
    avatar: normalizeAvatar(player.avatar, player.name),
    votes: counts[player.id] || 0,
    isLiar: player.id === liarId,
  })).sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))

  return {
    id: `${room.gameId}-${room.round}-${Date.now()}`,
    round: room.round,
    totalRounds: room.alibi?.totalRounds || 3,
    caseTitle: room.alibi?.currentCase?.title || 'Coartada',
    caseBrief: room.alibi?.currentCase?.brief || '',
    accusedId,
    detected,
    tiedWithLiar,
    leaderIds,
    detective: detective ? {
      id: detective.id,
      name: detective.name,
      avatar: normalizeAvatar(detective.avatar, detective.name),
    } : null,
    liar: liar ? {
      id: liar.id,
      name: liar.name,
      avatar: normalizeAvatar(liar.avatar, liar.name),
      claimedLocation: liarAssignment?.claimedLocation || null,
      realLocation: liarAssignment?.realLocation || null,
    } : null,
    voteCounts,
    points: pointRows,
    scoreboard: alibiScoreboard(room),
  }
}

function alibiGameOverPayload(room, roundResult) {
  const scoreboard = alibiScoreboard(room)
  return {
    gameId: room.gameId,
    winner: 'alibi',
    reason: 'roundsComplete',
    mode: 'alibi',
    playedAt: Date.now(),
    roundResult,
    alibiScoreboard: scoreboard,
    players: room.players.map(player => ({
      id: player.id,
      name: player.name,
      avatar: normalizeAvatar(player.avatar, player.name),
      profileId: player.profileId || null,
      isGuest: player.isGuest !== false || !player.profileId,
      role: room.roles[player.id],
    })),
  }
}

function assignRoles(room) {
  const cfg = room.config
  const catKey = cfg.category === 'random' || !cfg.category
    ? pickOne(Object.keys(wordBank))
    : (wordBank[cfg.category] ? cfg.category : pickOne(Object.keys(wordBank)))
  const words = wordBank[catKey]
  const selectedWord = pickWordAvoidingRecent(words, room.recentWords)
  const word = selectedWord.word
  room.category = catKey
  room.word = word
  room.recentWords = appendRecentWord(selectedWord.resetHistory ? [] : room.recentWords, word)

  if (cfg.mode === 'blind') {
    room.fakeWord = pickFakeWord(word, catKey, cfg.blindIntensity || 'medium')
  } else {
    room.fakeWord = null
  }
  if (cfg.mode === 'clue') {
    room.clue = buildClue(word, catKey, cfg.clueType || 'category', cfg.customClue)
  } else {
    room.clue = null
  }

  const indices = shuffle(room.players.map((_, i) => i))
  const impostorCount = Math.max(1, Math.min(cfg.impostorCount || 1, room.players.length))
  const impostorIdx = new Set(indices.slice(0, impostorCount))

  room.roles = {}
  room.players.forEach((p, i) => {
    const isImpostor = impostorIdx.has(i)
    room.roles[p.id] = isImpostor ? 'impostor' : 'citizen'
  })
  if (cfg.detectiveEnabled) {
    const detective = pickOne(room.players)
    if (detective) {
      const wasImpostor = isImpostorRole(room.roles[detective.id])
      if (wasImpostor && cfg.mode === 'blind') {
        room.roles[detective.id] = 'detective-blind'
        const replacement = pickOne(room.players.filter(player => (
          player.id !== detective.id && room.roles[player.id] === 'citizen'
        )))
        if (replacement) room.roles[replacement.id] = 'impostor'
      } else {
        room.roles[detective.id] = wasImpostor ? 'detective-impostor' : 'detective'
      }
    }
  }
}

function rolePayloadFor(room, playerId) {
  const role = room.roles[playerId]
  if (!role) return null
  if (isAlibiConfig(room.config)) {
    return {
      role,
      word: null,
      clue: null,
      impostorTeammates: [],
      alibi: alibiAssignmentFor(room, playerId),
      detectiveInterrogationUsed: room.detectiveInterrogationUsedBy === playerId,
    }
  }
  if (isPartyLineConfig(room.config)) {
    return {
      role: 'partyline-player',
      word: null,
      clue: null,
      impostorTeammates: [],
      partyLine: partyLinePrivateFor(room, playerId),
      detectiveInterrogationUsed: false,
    }
  }
  const impostorTeammates = impostorTeammatesFor(room, playerId)
  const impostorPrivate = canUseImpostorChat(room, playerId)
    ? {
        impostorChatMessages: impostorChatMessagesFor(room, playerId),
        impostorLastGuessRound: room.impostorLastGuessRound ?? -1,
      }
    : {
        impostorChatMessages: [],
        impostorLastGuessRound: -1,
      }
  if (role === 'citizen') return { role: 'citizen', word: room.word, clue: null, impostorTeammates: [] }
  if (role === 'detective') {
    return {
      role: 'detective',
      word: room.word,
      clue: null,
      impostorTeammates: [],
      detectiveInterrogationUsed: room.detectiveInterrogationUsedBy === playerId,
    }
  }
  if (role === 'detective-blind') {
    return {
      role: 'detective',
      word: room.fakeWord,
      clue: null,
      impostorTeammates: [],
      detectiveInterrogationUsed: room.detectiveInterrogationUsedBy === playerId,
    }
  }
  if (role === 'detective-impostor' && room.config.mode === 'blind') {
    return {
      role: 'detective',
      word: room.fakeWord,
      clue: null,
      impostorTeammates: [],
      detectiveInterrogationUsed: room.detectiveInterrogationUsedBy === playerId,
    }
  }
  if (role === 'detective-impostor') {
    return {
      role: 'detective-impostor',
      word: room.config.mode === 'blind' ? room.fakeWord : null,
      clue: room.config.mode === 'clue' ? room.clue : null,
      impostorTeammates,
      ...impostorPrivate,
      detectiveInterrogationUsed: room.detectiveInterrogationUsedBy === playerId,
    }
  }
  if (room.config.mode === 'blind') return { role: 'impostor-blind', word: room.fakeWord, clue: null, impostorTeammates: [] }
  if (room.config.mode === 'clue')  return { role: 'impostor-clue',  word: null, clue: room.clue, impostorTeammates, ...impostorPrivate }
  return { role: 'impostor', word: null, clue: null, impostorTeammates, ...impostorPrivate }
}

function impostorTeammatesFor(room, playerId) {
  const role = room.roles[playerId]
  if (!isImpostorRole(role)) return []
  if (room.config.mode === 'blind') return []
  return room.players
    .filter(player => player.id !== playerId && isImpostorRole(room.roles[player.id]))
    .map(player => ({
      id: player.id,
      name: player.name,
      avatar: normalizeAvatar(player.avatar, player.name),
    }))
}

function emitYourRole(room) {
  room.players.forEach(p => {
    const payload = rolePayloadFor(room, p.id)
    if (payload && p.socketId && !p.disconnected) io.to(p.socketId).emit('game:yourRole', payload)
  })
}

function emitPartyLineRound(room) {
  const publicRound = publicPartyLineRound(room)
  const summary = publicPartyLineSummary(room)
  room.players.forEach(player => {
    if (!player.socketId || player.disconnected) return
    io.to(player.socketId).emit('game:partyLineRound', {
      round: room.round,
      partyLine: summary,
      partyLineRound: publicRound,
      privateRound: partyLinePrivateFor(room, player.id),
      scoreboard: partyLineScoreboard(room),
    })
  })
}

function emitPartyLineSubmissionUpdate(room) {
  const round = publicPartyLineRound(room)
  io.to(room.code).emit('game:partyLineSubmissionUpdate', {
    submittedPlayerIds: round?.submittedPlayerIds || [],
    submittedCount: round?.submittedCount || 0,
    totalPlayers: round?.totalPlayers || 0,
  })
}

function activePlayers(room) { return room.players.filter(p => !p.eliminated) }

function checkVictory(room) {
  if (isAlibiConfig(room.config)) return null
  if (isPartyLineConfig(room.config)) return null
  if (room.impostorGuessedWord) return { winner: 'impostor', reason: 'wordGuessed' }
  const active = activePlayers(room)
  const activeImpostors = active.filter(p => isImpostorRole(room.roles[p.id]))
  const activeCitizens = active.filter(p => isCitizenTeamRole(room.roles[p.id]))
  if (activeImpostors.length === 0) return { winner: 'citizens', reason: 'allImpostorsCaught' }
  if (activeImpostors.length >= activeCitizens.length) return { winner: 'impostor', reason: 'majority' }
  return null
}

function gameOverPayload(room, victory) {
  const impostorIds = Object.entries(room.roles).filter(([, r]) => isImpostorRole(r)).map(([id]) => id)
  const result = {
    gameId: room.gameId,
    winner: victory.winner, reason: victory.reason,
    impostorIds, word: room.word, fakeWord: room.fakeWord,
    mode: room.config?.mode || null,
    category: room.category || room.config?.category || null,
    playedAt: Date.now(),
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: normalizeAvatar(p.avatar, p.name),
      profileId: p.profileId || null,
      isGuest: p.isGuest !== false || !p.profileId,
      role: room.roles[p.id],
    })),
  }
  result.scoreSummary = applyRoomScoreSummary(room, result)
  return result
}

function recordGlobalResult(result) {
  leaderboardStore.recordMatchResult(result).catch(error => {
    console.warn(`[leaderboard] Could not record match ${result?.gameId || ''}: ${error.message}`)
  })
}

function broadcastPlayers(room) {
  io.to(room.code).emit('room:players', { players: sanitizeRoom(room).players })
}

function syncHostFlags(room) {
  const host = room.players.find(p => p.id === room.hostId) || null
  room.players.forEach(p => {
    p.isHost = p.id === room.hostId
  })
  return host
}

function assignHost(room) {
  if (!room.players.length) return null
  let host = room.players.find(p => p.id === room.hostId && !p.disconnected && !p.eliminated)
  if (!host) {
    host = room.players.find(p => !p.disconnected && !p.eliminated)
      || room.players.find(p => !p.disconnected)
      || room.players[0]
    room.hostId = host.id
  }
  syncHostFlags(room)
  return host
}

function notifyHostAssigned(room, host) {
  if (!host?.socketId) return
  io.to(host.socketId).emit('room:hostAssigned', { room: sanitizeRoom(room, host.id) })
}

function emitVoteUpdate(room) {
  io.to(room.code).emit('vote:update', {
    votes: room.votes,
    votersReady: Object.keys(room.voters).length,
  })
}

function recalculateVotes(room) {
  const activeIds = new Set(activePlayers(room).map(p => p.id))
  Object.entries(room.voters).forEach(([voterId, targetId]) => {
    if (!activeIds.has(voterId) || !activeIds.has(targetId)) {
      delete room.voters[voterId]
    }
  })
  const counts = {}
  Object.values(room.voters).forEach(target => {
    counts[target] = (counts[target] || 0) + 1
  })
  room.votes = counts
}

function advanceToDiscussion(room) {
  room.votes = {}
  room.voters = {}
  room.round += 1
  room.phase = 'discussion'
  const speakOrder = makeSpeakOrder(room)
  room.speakOrder = speakOrder
  io.to(room.code).emit('game:phase', { phase: 'discussion', speakOrder })
  io.to(room.code).emit('game:newRound', { round: room.round, speakOrder })
  saveRoom(room)
}

function resolveNoElimination(room, counts, reason) {
  room.lastTie = { counts, reason, at: Date.now() }
  io.to(room.code).emit('game:tie', { counts, reason })
  advanceToDiscussion(room)
}

function tryAdvanceReveal(room) {
  if (room.phase !== 'reveal') return
  if (room.players.every(p => p.ready)) {
    room.phase = 'discussion'
    const speakOrder = makeSpeakOrder(room)
    room.speakOrder = speakOrder
    io.to(room.code).emit('game:phase', { phase: 'discussion', speakOrder })
    saveRoom(room)
  }
}

function afterPlayerListChanged(room) {
  if (isPartyLineConfig(room.config) && room.phase === 'partyRound') {
    tryResolvePartyLineSubmissions(room)
    return
  }
  if (room.phase !== 'lobby' && room.phase !== 'ended') {
    const v = checkVictory(room)
    if (v) {
      room.phase = 'ended'
      room.result = gameOverPayload(room, v)
      clearInterrogation(room)
      io.to(room.code).emit('game:over', room.result)
      recordGlobalResult(room.result)
      saveRoom(room)
      return
    }
  }
  if (room.phase === 'reveal') {
    tryAdvanceReveal(room)
  }
  if (room.phase === 'voting') {
    recalculateVotes(room)
    emitVoteUpdate(room)
    tryResolveVotes(room)
  }
}

function tryResolveVotes(room) {
  if (isAlibiConfig(room.config)) {
    tryResolveAlibiVotes(room)
    return
  }
  const activeIds = activePlayers(room).map(p => p.id)
  const allVoted = activeIds.every(id => !!room.voters[id])
  if (!allVoted) return
  recalculateVotes(room)
  emitVoteUpdate(room)
  const counts = room.votes
  const entries = Object.entries(counts)
  if (!entries.length) return
  const max = Math.max(...entries.map(([, c]) => c))
  const leaders = entries.filter(([, c]) => c === max)
  const required = Math.floor(activeIds.length / 2) + 1
  if (leaders.length > 1 || max === 0) {
    resolveNoElimination(room, counts, 'tie')
    return
  }
  if (max < required) {
    resolveNoElimination(room, counts, 'noMajority')
    return
  }
  const [eliminatedId] = leaders[0]
  const player = room.players.find(p => p.id === eliminatedId)
  if (player) player.eliminated = true
  room.eliminatedIds.push(eliminatedId)
  io.to(room.code).emit('game:eliminated', {
    playerId: eliminatedId,
    wasImpostor: isImpostorRole(room.roles[eliminatedId]),
    name: player?.name,
  })
  const v = checkVictory(room)
  if (!v && eliminatedId === room.hostId) {
    const newHost = assignHost(room)
    notifyHostAssigned(room, newHost)
  }
  broadcastPlayers(room)
  if (v) {
    room.phase = 'ended'
    room.result = gameOverPayload(room, v)
    clearInterrogation(room)
    io.to(room.code).emit('game:over', room.result)
    recordGlobalResult(room.result)
    saveRoom(room)
  } else {
    advanceToDiscussion(room)
  }
}

function tryResolveAlibiVotes(room) {
  const detectiveId = room.alibi?.detectiveId
  const detective = room.players.find(player => (
    player.id === detectiveId && !player.eliminated && !player.disconnected
  ))
  if (!detective || !room.voters[detectiveId]) return
  recalculateVotes(room)
  emitVoteUpdate(room)
  const roundResult = alibiVoteResult(room)
  room.alibi.roundResult = roundResult
  room.alibi.history = [...(room.alibi.history || []), roundResult]

  if (room.round >= (room.alibi?.totalRounds || 3)) {
    room.phase = 'ended'
    room.result = alibiGameOverPayload(room, roundResult)
    io.to(room.code).emit('game:alibiRoundResult', { roundResult })
    io.to(room.code).emit('game:over', room.result)
    saveRoom(room)
    return
  }

  room.phase = 'roundResult'
  io.to(room.code).emit('game:alibiRoundResult', { roundResult })
  io.to(room.code).emit('game:phase', { phase: 'roundResult' })
  saveRoom(room)
}

function tryResolvePartyLineSubmissions(room) {
  if (!room || !isPartyLineConfig(room.config) || room.phase !== 'partyRound') return false
  const round = room.partyLine?.currentRound
  if (!round) return false
  const activeIds = room.players
    .filter(item => !item.disconnected && round.assignments?.[item.id])
    .map(item => item.id)
  if (activeIds.length < 2) return false
  const allSubmitted = activeIds.every(id => !!round.submissions[id])
  if (!allSubmitted) {
    emitPartyLineSubmissionUpdate(room)
    saveRoom(room)
    return false
  }

  const roundResult = resolvePartyLineRound(room)
  if (!roundResult) return false
  clearPartyLineCalls(room)
  if (room.round >= (room.partyLine?.totalRounds || 5)) {
    room.phase = 'ended'
    room.result = partyLineGameOverPayload(room, roundResult)
    io.to(room.code).emit('game:partyLineResult', { roundResult })
    io.to(room.code).emit('game:over', room.result)
    saveRoom(room)
    return true
  }

  room.phase = 'partyResult'
  io.to(room.code).emit('game:partyLineResult', { roundResult })
  io.to(room.code).emit('game:phase', { phase: 'partyResult' })
  saveRoom(room)
  return true
}

function findPlayerByName(room, name) {
  const n = sanitizeName(name).toLowerCase()
  if (!n) return null
  return room.players.find(p => p.name.toLowerCase() === n) || null
}

function findPlayerForResume(room, name, sessionToken) {
  if (!isValidSessionToken(sessionToken)) return null
  const player = findPlayerByName(room, name)
  if (!player || player.sessionToken !== sessionToken) return null
  return player
}

io.use((socket, next) => {
  const clientIp = getClientIpFromSocket(socket)
  socket.data.clientIp = clientIp

  if (isIpExempt(clientIp)) return next()

  const key = rateLimitKeyForIp(clientIp)
  const activeConnections = ipConnectionCounts.get(key) || 0
  if (activeConnections >= MAX_CONNECTIONS_PER_IP) {
    const error = new Error(`Limite de ${MAX_CONNECTIONS_PER_IP} conexiones simultaneas por IP excedido.`)
    error.data = {
      code: 'IP_CONNECTION_LIMIT',
      maxConnections: MAX_CONNECTIONS_PER_IP,
    }
    return next(error)
  }

  ipConnectionCounts.set(key, activeConnections + 1)
  socket.data.rateLimitIpKey = key
  socket.data.ipConnectionTracked = true
  return next()
})

io.on('connection', (socket) => {

  socket.on('room:create', async ({ hostName, avatar, config, profileId, isGuest } = {}) => {
    if (!allow(socket.id, 2)) return
    const name = sanitizeName(hostName)
    if (!name) { socket.emit('room:error', { message: 'Nombre inválido' }); return }
    if (!allowRoomCreationForIp(socket.data.clientIp)) {
      socket.emit('room:error', {
        message: `Limite de ${MAX_ROOM_CREATIONS_PER_IP_PER_HOUR} salas creadas por IP en 1 hora excedido. Intenta de nuevo mas tarde.`,
      })
      return
    }
    const room = await makeRoom(socket.id, name, avatar, config || {}, { profileId, isGuest })
    socket.join(room.code)
    await persistRoom(room)
    socket.emit('room:created', {
      code: room.code,
      room: sanitizeRoom(room),
      you: privatePlayerPayload(room.players[0]),
    })
  })

  socket.on('room:join', async ({ code, playerName, avatar, profileId, isGuest } = {}) => {
    if (!allow(socket.id, 2)) return
    if (!isValidCode(code)) { socket.emit('room:error', { message: 'Código inválido' }); return }
    const name = sanitizeName(playerName)
    if (!name) { socket.emit('room:error', { message: 'Nombre inválido' }); return }
    const room = await getRoomByCode(code)
    if (!room) { socket.emit('room:error', { message: 'Sala no encontrada' }); return }
    if (room.players.length >= 12) { socket.emit('room:error', { message: 'Sala llena' }); return }
    if (room.phase !== 'lobby') { socket.emit('room:error', { message: 'La partida ya empezó' }); return }
    if (findPlayerByName(room, name)) { socket.emit('room:error', { message: 'Ese nombre ya está en la sala' }); return }
    const playerProfile = sanitizePlayerProfile({ profileId, isGuest })
    const player = {
      id: playerIdGen(), socketId: socket.id,
      sessionToken: tokenGen(),
      name, avatar: normalizeAvatar(avatar, name),
      profileId: playerProfile.profileId,
      isGuest: playerProfile.isGuest,
      isHost: false, ready: false, eliminated: false, disconnected: false,
      disconnectedAt: null, disconnectExpiresAt: null,
    }
    room.players.push(player)
    socket.join(room.code)
    socket.emit('room:joined', { code: room.code, room: sanitizeRoom(room), you: privatePlayerPayload(player) })
    broadcastPlayers(room)
    saveRoom(room)
  })

  socket.on('room:resume', async ({ code, name, sessionToken } = {}) => {
    if (!allow(socket.id, 1)) return
    if (!isValidCode(code)) {
      socket.emit('room:resumeFailed', { message: 'Codigo invalido' })
      return
    }
    const room = await getRoomByCode(code)
    if (!room) {
      socket.emit('room:resumeFailed', { message: 'La sala ya no existe' })
      return
    }
    const player = findPlayerForResume(room, name, sessionToken)
    if (!player) {
      socket.emit('room:resumeFailed', { message: 'No se pudo recuperar tu asiento' })
      return
    }
    if (room.disconnectTimers[player.id]) {
      clearTimeout(room.disconnectTimers[player.id])
      delete room.disconnectTimers[player.id]
    }
    if (player.socketId && player.socketId !== socket.id) {
      removeVoicePeer(player.id, room)
      io.sockets.sockets.get(player.socketId)?.leave(room.code)
    }
    player.socketId = socket.id
    player.disconnected = false
    player.disconnectedAt = null
    player.disconnectExpiresAt = null
    if (room.players.some(item => item.id === room.hostId)) {
      syncHostFlags(room)
    } else {
      assignHost(room)
    }
    if (room.phase === 'voting') {
      recalculateVotes(room)
      emitVoteUpdate(room)
    }
    socket.join(room.code)
    const clientPhase = player.eliminated && room.phase !== 'lobby' && room.phase !== 'ended'
      ? 'spectator'
      : room.phase === 'voting' && room.voters[player.id]
        ? 'voted'
        : room.phase
    const you = {
      ...privatePlayerPayload(player),
      clientPhase,
      votedFor: room.voters[player.id] || null,
      lastGuessRound: room.lastGuessRounds[player.id] ?? -1,
      ...(room.phase === 'caseIntro' ? {} : (rolePayloadFor(room, player.id) || {})),
    }
    socket.emit('room:resumed', { code: room.code, room: sanitizeRoom(room, player.id), you })
    broadcastPlayers(room)
    saveRoom(room)
  })

  socket.on('room:updateConfig', ({ config } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    room.config = { ...room.config, ...sanitizeConfig(config) }
    io.to(room.code).emit('room:config', { config: room.config })
    saveRoom(room)
  })

  socket.on('room:leave', () => leaveSocket(socket, true))

  socket.on('partyline:callRequest', ({ targetId } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const caller = getPlayerBySocket(room, socket.id)
    if (!room || !caller || caller.eliminated || caller.disconnected) return
    if (!isPartyLineConfig(room.config) || room.phase !== 'partyRound') return
    if (typeof targetId !== 'string' || targetId === caller.id) return

    const target = room.players.find(player => player.id === targetId && !player.eliminated && !player.disconnected)
    const round = room.partyLine?.currentRound
    if (!target || !round?.assignments?.[caller.id] || !round.assignments[targetId]) {
      socket.emit('partyline:error', { message: 'Esa linea no esta disponible.' })
      return
    }

    const clearedIncoming = declineIncomingCallsFor(room, caller.id)
    if (isPartyLineCallerBusy(room, caller.id)) {
      if (clearedIncoming) {
        emitPartyLineCalls(room)
        saveRoom(room)
      }
      socket.emit('partyline:error', { message: 'Ya tienes una llamada en curso.' })
      return
    }
    if (isPartyLineTargetBusy(room, target.id)) {
      if (clearedIncoming) {
        emitPartyLineCalls(room)
        saveRoom(room)
      }
      socket.emit('partyline:error', { message: `${target.name} esta ocupado.` })
      return
    }

    const now = Date.now()
    room.partyLineCalls = room.partyLineCalls || []
    room.partyLineCalls.push({
      id: `call-${now}-${caller.id}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'ringing',
      callerId: caller.id,
      callerName: caller.name,
      callerAvatar: normalizeAvatar(caller.avatar, caller.name),
      targetId: target.id,
      targetName: target.name,
      targetAvatar: normalizeAvatar(target.avatar, target.name),
      startedAt: now,
      updatedAt: now,
    })
    emitPartyLineCalls(room)
    saveRoom(room)
  })

  socket.on('partyline:callAccept', ({ callId } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || player.eliminated || player.disconnected) return
    if (!isPartyLineConfig(room.config) || room.phase !== 'partyRound') return
    const call = (room.partyLineCalls || []).find(item => item.id === callId && item.status === 'ringing')
    if (!call || call.targetId !== player.id) return

    const caller = room.players.find(item => item.id === call.callerId && !item.eliminated && !item.disconnected)
    if (!caller || partyLineActiveCallFor(room, player.id) || partyLineOutgoingCallFor(room, player.id)) {
      room.partyLineCalls = (room.partyLineCalls || []).filter(item => item.id !== call.id)
      emitPartyLineCalls(room)
      saveRoom(room)
      return
    }

    const now = Date.now()
    room.partyLineCalls = (room.partyLineCalls || []).filter(item => (
      item.id === call.id ||
      (item.callerId !== call.callerId && item.targetId !== call.callerId && item.callerId !== call.targetId && item.targetId !== call.targetId)
    ))
    call.status = 'active'
    call.acceptedAt = now
    call.updatedAt = now
    if (!room.partyLineCalls.includes(call)) room.partyLineCalls.push(call)
    emitPartyLineCalls(room)
    saveRoom(room)
  })

  socket.on('partyline:callDecline', ({ callId } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || !isPartyLineConfig(room.config)) return
    const before = room.partyLineCalls?.length || 0
    room.partyLineCalls = (room.partyLineCalls || []).filter(call => !(
      call.id === callId && call.status === 'ringing' && call.targetId === player.id
    ))
    if (before !== room.partyLineCalls.length) {
      emitPartyLineCalls(room)
      saveRoom(room)
    }
  })

  socket.on('partyline:callCancel', ({ callId } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || !isPartyLineConfig(room.config)) return
    const before = room.partyLineCalls?.length || 0
    room.partyLineCalls = (room.partyLineCalls || []).filter(call => !(
      call.id === callId && call.status === 'ringing' && call.callerId === player.id
    ))
    if (before !== room.partyLineCalls.length) {
      emitPartyLineCalls(room)
      saveRoom(room)
    }
  })

  socket.on('partyline:callHangup', ({ callId } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || !isPartyLineConfig(room.config)) return
    const before = room.partyLineCalls?.length || 0
    room.partyLineCalls = (room.partyLineCalls || []).filter(call => !(
      call.id === callId &&
      call.status === 'active' &&
      (call.callerId === player.id || call.targetId === player.id)
    ))
    if (before !== room.partyLineCalls.length) {
      emitPartyLineCalls(room)
      saveRoom(room)
    }
  })

  socket.on('voice:join', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const player = getPlayerBySocket(room, socket.id)
    if (!player || player.disconnected) return

    if (!room.voicePeers) room.voicePeers = new Set()
    const wasAlreadyJoined = room.voicePeers.has(player.id)
    const peers = [...room.voicePeers].filter(peerId => (
      peerId !== player.id && partyLineVoicePeerAllowed(room, player.id, peerId)
    ))
    room.voicePeers.add(player.id)
    socket.emit('voice:peers', { peers })
    if (!wasAlreadyJoined) {
      ;[...room.voicePeers].forEach(peerId => {
        if (peerId === player.id || !partyLineVoicePeerAllowed(room, peerId, player.id)) return
        const peer = room.players.find(p => p.id === peerId && !p.disconnected)
        if (peer?.socketId) io.to(peer.socketId).emit('voice:peerJoined', { peerId: player.id })
      })
    }
  })

  socket.on('voice:leave', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (player) removeVoicePeer(player.id, room)
  })

  socket.on('voice:signal', ({ targetId, signal } = {}) => {
    if (!allowVoiceSignal(socket.id)) return
    const room = getRoomBySocket(socket.id)
    const sender = getPlayerBySocket(room, socket.id)
    if (!room || typeof targetId !== 'string') return
    if (!sender || !room.voicePeers?.has(sender.id) || !room.voicePeers?.has(targetId)) return
    if (!partyLineVoicePeerAllowed(room, sender.id, targetId)) return
    const target = room.players.find(p => p.id === targetId && !p.disconnected)
    if (!target?.socketId) return

    const cleanSignal = sanitizeVoiceSignal(signal)
    if (!cleanSignal) return
    io.to(target.socketId).emit('voice:signal', { fromId: sender.id, signal: cleanSignal })
  })

  socket.on('voice:audio', (payload = {}) => {
    if (!allowVoiceAudio(socket.id)) return
    const room = getRoomBySocket(socket.id)
    const sender = getPlayerBySocket(room, socket.id)
    if (!room || !sender || sender.disconnected || !room.voicePeers?.has(sender.id)) return

    const cleanAudio = sanitizeVoiceAudioPayload(payload)
    if (!cleanAudio) return

    room.voicePeers.forEach(peerId => {
      if (peerId === sender.id) return
      if (!partyLineVoicePeerAllowed(room, sender.id, peerId)) return
      const peer = room.players.find(p => p.id === peerId && !p.disconnected)
      if (!peer?.socketId) return
      io.to(peer.socketId).emit('voice:audio', {
        fromId: sender.id,
        audio: cleanAudio.audio,
        sampleRate: cleanAudio.sampleRate,
        sequence: cleanAudio.sequence,
      })
    })
  })

  socket.on('room:startGame', () => {
    if (!allow(socket.id, 2)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    if (room.players.length < 3) {
      socket.emit('room:error', { message: 'Se necesitan al menos 3 jugadores' })
      return
    }
    room.gameCounter += 1
    room.gameId = `${room.code}-${room.gameCounter}-${Date.now()}`
    clearInterrogation(room, { emit: false })
    room.round = 1
    const alibiGame = isAlibiConfig(room.config)
    const partyLineGame = isPartyLineConfig(room.config)
    if (alibiGame) resetAlibiGame(room)
    else if (partyLineGame) {
      room.partyLine = createPartyLineState(room)
      room.roles = {}
      room.players.forEach(p => { room.roles[p.id] = 'partyline-player' })
    } else assignRoles(room)
    room.phase = partyLineGame ? 'partyIntro' : alibiGame ? 'caseIntro' : 'reveal'
    room.votes = {}; room.voters = {}
    room.eliminatedIds = []
    room.chatMessages = []
    room.impostorChatMessages = []
    room.detectiveInterrogationUsedBy = null
    room.impostorGuessedWord = false
    room.impostorLastGuessRound = -1
    room.lastGuessRounds = {}
    room.speakOrder = []
    room.lastTie = null
    room.result = null
    room.partyLineCalls = []
    if (!isAlibiConfig(room.config)) {
      room.alibi = null
      room.alibiScores = {}
    }
    if (!partyLineGame) room.partyLine = null
    room.players.forEach(p => { p.eliminated = false; p.ready = false })
    io.to(room.code).emit('game:started', {
      phase: room.phase,
      alibiCase: alibiGame ? publicAlibiCase(room) : null,
      partyLine: partyLineGame ? publicPartyLineSummary(room) : null,
    })
    if (!alibiGame && !partyLineGame) emitYourRole(room)
    saveRoom(room)
  })

  socket.on('game:continuePartyLineIntro', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    if (!isPartyLineConfig(room.config) || room.phase !== 'partyIntro') return
    room.phase = 'partyRound'
    room.round = 1
    room.chatMessages = []
    room.partyLineCalls = []
    createPartyLineRound(room)
    io.to(room.code).emit('game:phase', { phase: 'partyRound' })
    emitPartyLineRound(room)
    saveRoom(room)
  })

  socket.on('game:continueAlibiIntro', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    if (!isAlibiConfig(room.config) || room.phase !== 'caseIntro') return
    room.phase = 'reveal'
    io.to(room.code).emit('game:phase', { phase: 'reveal' })
    emitYourRole(room)
    saveRoom(room)
  })

  socket.on('game:cardReady', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const player = getPlayerBySocket(room, socket.id)
    if (player) player.ready = true
    broadcastPlayers(room)
    tryAdvanceReveal(room)
    saveRoom(room)
  })

  socket.on('game:goToVote', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || player.eliminated || player.disconnected) return
    if (isAlibiConfig(room.config)) {
      if (!isDetectiveRole(room.roles[player.id])) return
    } else if (room.hostId !== player.id) {
      return
    }
    clearInterrogation(room)
    room.phase = 'voting'
    room.votes = {}; room.voters = {}
    io.to(room.code).emit('game:phase', { phase: 'voting' })
    saveRoom(room)
  })

  socket.on('chat:message', ({ text } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || (room.phase !== 'discussion' && room.phase !== 'partyRound')) return
    if (isPartyLineConfig(room.config)) {
      socket.emit('chat:error', { message: 'Linea Privada no permite chat de texto durante la partida' })
      return
    }
    const player = getPlayerBySocket(room, socket.id)
    if (!player || player.eliminated || player.disconnected) return
    if (
      room.interrogation &&
      player.id !== room.interrogation.detectiveId &&
      player.id !== room.interrogation.targetId
    ) {
      socket.emit('chat:error', { message: 'Solo el detective y el interrogado tienen la palabra' })
      return
    }
    if (!allowChatMessage(socket.id)) {
      socket.emit('chat:error', { message: 'Estas enviando mensajes muy rapido' })
      return
    }
    const cleanText = sanitizeChatText(text, (isAlibiConfig(room.config) || isPartyLineConfig(room.config)) ? 80 : CHAT_TEXT_MAX_LENGTH)
    if (!cleanText) return

    const message = chatPayloadFor(player, cleanText)
    room.chatMessages = [...room.chatMessages, message].slice(-CHAT_MESSAGE_LIMIT)
    io.to(room.code).emit('chat:message', { message })
    saveRoom(room)
  })

  socket.on('impostor:message', ({ text } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.phase !== 'discussion') return
    const player = getPlayerBySocket(room, socket.id)
    if (!player || !canUseImpostorChat(room, player.id)) return
    if (room.interrogation) {
      socket.emit('impostor:error', { message: 'El canal impostor se pausa durante el interrogatorio' })
      return
    }
    if (!allowChatMessage(socket.id)) {
      socket.emit('impostor:error', { message: 'Estas enviando mensajes muy rapido' })
      return
    }
    const cleanText = sanitizeImpostorChatText(text)
    if (!cleanText) return

    const message = chatPayloadFor(player, cleanText)
    room.impostorChatMessages = [...(room.impostorChatMessages || []), message].slice(-IMPOSTOR_CHAT_MESSAGE_LIMIT)
    emitToConsciousImpostors(room, 'impostor:message', { message })
    saveRoom(room)
  })

  socket.on('game:detectiveInterrogate', ({ targetId } = {}) => {
    if (!allow(socket.id, 2)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.phase !== 'discussion') return
    const detective = getPlayerBySocket(room, socket.id)
    if (!detective || detective.eliminated || detective.disconnected) return
    if (!isDetectiveRole(room.roles[detective.id])) {
      socket.emit('game:detectiveError', { message: 'Solo el detective puede interrogar' })
      return
    }
    if (room.detectiveInterrogationUsedBy) {
      socket.emit('game:detectiveError', { message: 'Ya usaste el interrogatorio' })
      return
    }
    if (room.interrogation) {
      socket.emit('game:detectiveError', { message: 'Ya hay un interrogatorio activo' })
      return
    }
    if (typeof targetId !== 'string' || targetId === detective.id) {
      socket.emit('game:detectiveError', { message: 'Elige otro jugador' })
      return
    }
    const target = room.players.find(p => p.id === targetId)
    if (!target || target.eliminated || target.disconnected) {
      socket.emit('game:detectiveError', { message: 'Ese jugador no esta disponible' })
      return
    }
    if (isAlibiConfig(room.config) && !room.alibi?.assignments?.[target.id]) {
      socket.emit('game:detectiveError', { message: 'Solo puedes interrogar sospechosos del caso' })
      return
    }

    room.detectiveInterrogationUsedBy = detective.id
    room.interrogation = buildInterrogationPayload(room, detective, target)
    scheduleInterrogationTimer(room)
    room.players.forEach(player => {
      if (player.disconnected || !player.socketId) return
      io.to(player.socketId).emit('game:interrogationStarted', {
        interrogation: interrogationPayloadFor(room.interrogation, player.id),
      })
    })
    saveRoom(room)
  })

  socket.on('vote:cast', ({ targetId } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.phase !== 'voting') return
    const voter = getPlayerBySocket(room, socket.id)
    if (!voter || voter.eliminated) return
    if (room.voters[voter.id]) return
    if (voter.id === targetId) return
    const target = room.players.find(p => p.id === targetId)
    if (!target || target.eliminated) return
    if (isAlibiConfig(room.config)) {
      if (!isDetectiveRole(room.roles[voter.id])) return
      if (!room.alibi?.assignments?.[targetId]) return
    }
    room.voters[voter.id] = targetId
    recalculateVotes(room)
    emitVoteUpdate(room)
    tryResolveVotes(room)
    saveRoom(room)
  })

  socket.on('game:partyLineSubmit', ({ action } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || !isPartyLineConfig(room.config) || room.phase !== 'partyRound') return
    const player = getPlayerBySocket(room, socket.id)
    if (!player || player.eliminated || player.disconnected) return
    const round = room.partyLine?.currentRound
    if (!round || !round.assignments?.[player.id] || round.submissions?.[player.id]) return

    const cleanAction = sanitizePartyLineAction(round, action)
    if (!cleanAction) return
    round.submissions[player.id] = { ...cleanAction, submittedAt: Date.now() }
    emitPartyLineSubmissionUpdate(room)
    if (!tryResolvePartyLineSubmissions(room)) saveRoom(room)
  })

  socket.on('game:newRound', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    if (isAlibiConfig(room.config)) return
    room.round += 1
    room.votes = {}; room.voters = {}
    room.phase = 'discussion'
    const speakOrder = makeSpeakOrder(room)
    room.speakOrder = speakOrder
    room.lastTie = null
    io.to(room.code).emit('game:newRound', { round: room.round, speakOrder })
    io.to(room.code).emit('game:phase', { phase: 'discussion', speakOrder })
    saveRoom(room)
  })

  socket.on('game:nextAlibiRound', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    if (!isAlibiConfig(room.config) || room.phase !== 'roundResult') return
    if (room.players.filter(p => !p.disconnected).length < 2) return
    room.round += 1
    room.votes = {}
    room.voters = {}
    room.lastTie = null
    room.phase = 'caseIntro'
    room.chatMessages = []
    room.players.forEach(p => { p.ready = false; p.eliminated = false })
    createAlibiRound(room)
    io.to(room.code).emit('game:alibiNextRound', {
      round: room.round,
      alibiCase: publicAlibiCase(room),
    })
    io.to(room.code).emit('game:phase', { phase: 'caseIntro' })
    broadcastPlayers(room)
    saveRoom(room)
  })

  socket.on('game:nextPartyLineRound', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    if (!isPartyLineConfig(room.config) || room.phase !== 'partyResult') return
    if (room.players.filter(p => !p.disconnected).length < 3) return
    room.round += 1
    room.votes = {}
    room.voters = {}
    room.lastTie = null
    room.phase = 'partyRound'
    room.chatMessages = []
    room.partyLineCalls = []
    room.players.forEach(p => { p.ready = false; p.eliminated = false })
    createPartyLineRound(room)
    io.to(room.code).emit('game:phase', { phase: 'partyRound' })
    emitPartyLineRound(room)
    broadcastPlayers(room)
    saveRoom(room)
  })

  socket.on('room:rematch', () => {
    if (!allow(socket.id, 2)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    if (room.phase !== 'ended') return
    // Limpiar timers de desconexión (jugadores que se fueron a mitad ya se descartaron)
    Object.values(room.disconnectTimers).forEach(clearTimeout)
    room.disconnectTimers = {}
    // Reset estado de partida, conservando jugadores y config
    room.phase = 'lobby'
    room.round = 1
    room.votes = {}
    room.voters = {}
    room.eliminatedIds = []
    room.word = null
    room.fakeWord = null
    room.clue = null
    room.category = null
    room.gameId = null
    room.chatMessages = []
    room.impostorChatMessages = []
    room.roles = {}
    room.detectiveInterrogationUsedBy = null
    clearInterrogation(room, { emit: false })
    room.impostorGuessedWord = false
    room.impostorLastGuessRound = -1
    room.lastGuessRounds = {}
    room.speakOrder = []
    room.lastTie = null
    room.result = null
    room.alibi = null
    room.alibiScores = {}
    room.partyLine = null
    room.partyLineCalls = []
    room.players.forEach(p => {
      p.eliminated = false
      p.ready = false
    })
    io.to(room.code).emit('room:rematch', { room: sanitizeRoom(room) })
    saveRoom(room)
  })

  socket.on('game:guessWord', ({ word } = {}) => {
    if (!allow(socket.id, 2)) return
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const player = getPlayerBySocket(room, socket.id)
    if (!player || !canGuessWord(room, player.id)) return
    if (room.phase === 'ended') return
    const lastRound = Number.isFinite(room.impostorLastGuessRound) ? room.impostorLastGuessRound : -1
    if (room.round - lastRound < 2) {
      socket.emit('game:guessBlocked', { availableAt: lastRound + 2, lastGuessRound: lastRound })
      return
    }
    const guess = (word || '').toString().trim().toLowerCase()
    if (!guess) return
    room.impostorLastGuessRound = room.round
    room.lastGuessRounds[player.id] = room.round
    const correct = guess === (room.word || '').toLowerCase()
    if (correct) {
      room.impostorGuessedWord = true
      const v = { winner: 'impostor', reason: 'wordGuessed' }
      room.phase = 'ended'
      room.result = gameOverPayload(room, v)
      clearInterrogation(room)
      io.to(room.code).emit('game:over', room.result)
      recordGlobalResult(room.result)
    } else {
      io.to(room.code).emit('game:guessFailed', {
        playerId: player.id,
        lastGuessRound: room.impostorLastGuessRound,
        availableAt: room.impostorLastGuessRound + 2,
      })
    }
    saveRoom(room)
  })

  socket.on('disconnect', () => {
    releaseIpConnection(socket)
    leaveSocket(socket, false)
  })
})

function leaveSocket(socket, hard) {
  const room = getRoomBySocket(socket.id)
  buckets.delete(socket.id)
  chatWindows.delete(socket.id)
  voiceSignalBuckets.delete(socket.id)
  voiceAudioBuckets.delete(socket.id)
  if (!room) return
  const player = room.players.find(p => p.socketId === socket.id)
  if (!player) return
  const wasActiveGame = room.phase !== 'lobby' && room.phase !== 'ended'
  removeVoicePeer(player.id, room)
  const callsChanged = endPartyLineCallsFor(room, player.id)

  // Lobby o ended o disconnect "hard": eliminar completamente
  if (hard || room.phase === 'ended') {
    room.players = room.players.filter(p => p.socketId !== socket.id)
    delete room.roles[player.id]
    delete room.voters[player.id]
    delete room.votes[player.id]
    delete room.lastGuessRounds[player.id]
    room.speakOrder = (room.speakOrder || []).filter(id => id !== player.id)
    if (room.interrogation && (room.interrogation.detectiveId === player.id || room.interrogation.targetId === player.id)) {
      clearInterrogation(room)
    }
    if (!room.players.length) {
      clearInterrogation(room, { emit: false })
      removeRoom(room.code)
      return
    }
    const hostChanged = room.hostId === player.id
    const newHost = assignHost(room)
    broadcastPlayers(room)
    if (callsChanged) emitPartyLineCalls(room)
    if (hostChanged) notifyHostAssigned(room, newHost)
    if (wasActiveGame) afterPlayerListChanged(room)
    saveRoom(room)
    return
  }

  // Partida en curso → marcar desconectado y dar gracia para reconexión
  player.disconnected = true
  player.disconnectedAt = Date.now()
  player.disconnectExpiresAt = player.disconnectedAt + RECONNECT_GRACE_MS
  player.socketId = null
  broadcastPlayers(room)
  if (callsChanged) emitPartyLineCalls(room)
  scheduleDisconnectTimer(room, player)
  saveRoom(room)
}

server.listen(PORT, HOST, () => {
  console.log(`[el-impostor] server listening on ${HOST}:${PORT}`)
})
