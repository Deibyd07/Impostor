import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { customAlphabet } from 'nanoid'
import { wordBank, categories, relatedWords } from './wordBank.js'
import { normalizeAvatar } from './avatars.js'

const app = express()
app.use(cors())
app.get('/', (_, res) => res.json({ ok: true, app: 'el-impostor', version: '1.2.1' }))
app.get('/health', (_, res) => res.json({ ok: true, rooms: rooms.size }))

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

const PORT = process.env.PORT || 3001
const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)
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
  return shuffleOrder(room.players.filter(p => !p.eliminated).map(p => p.id))
}

const rooms = new Map() // code -> Room
const RECONNECT_GRACE_MS = 60_000
const RECENT_WORD_LIMIT = 10
const CHAT_MESSAGE_LIMIT = 50
const CHAT_TEXT_MAX_LENGTH = 20
const CHAT_RATE_LIMIT = 20
const CHAT_RATE_WINDOW_MS = 60_000
const INTERROGATION_DURATION_MS = 30_000
const INTERROGATION_PROMPTS = [
  'Describe la palabra usando exactamente 3 palabras.',
  'Da una pista sin mencionar la categoria.',
  'Relaciona la palabra con una experiencia concreta.',
  'Menciona algo cercano a la palabra, sin decir la palabra.',
  'Da una pista que suene natural en una conversacion.',
  'Explica por que alguien reconoceria esta palabra.',
]

// --- rate limiting (token bucket por socket) ---
const buckets = new Map() // socketId -> { tokens, last }
const chatWindows = new Map() // socketId -> [timestamps]
const voiceSignalBuckets = new Map()
const voiceAudioBuckets = new Map()
const BUCKET_MAX = 40
const BUCKET_REFILL_PER_SEC = 12
const VOICE_SIGNAL_BUCKET_MAX = 240
const VOICE_SIGNAL_REFILL_PER_SEC = 90
const VOICE_AUDIO_BUCKET_MAX = 45
const VOICE_AUDIO_REFILL_PER_SEC = 18
const VOICE_AUDIO_MAX_BYTES = 8192
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
function sanitizeChatText(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, CHAT_TEXT_MAX_LENGTH)
}
function isValidCode(s) {
  return typeof s === 'string' && /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/i.test(s)
}
function isValidSessionToken(s) {
  return typeof s === 'string' && /^[0-9A-Za-z]{24}$/.test(s)
}
function sanitizeConfig(cfg) {
  const out = {}
  if (typeof cfg !== 'object' || !cfg) return out
  if (typeof cfg.mode === 'string' && ['classic', 'clue', 'blind'].includes(cfg.mode)) out.mode = cfg.mode
  if (typeof cfg.category === 'string' && (cfg.category === 'random' || wordBank[cfg.category])) out.category = cfg.category
  if (Number.isFinite(cfg.impostorCount)) out.impostorCount = Math.max(1, Math.floor(cfg.impostorCount))
  if (typeof cfg.clueType === 'string' && ['category','firstLetter','wordLength','vague','custom'].includes(cfg.clueType)) out.clueType = cfg.clueType
  if (typeof cfg.customClue === 'string') out.customClue = cfg.customClue.slice(0, 80)
  if (typeof cfg.blindIntensity === 'string' && ['near','medium','far'].includes(cfg.blindIntensity)) out.blindIntensity = cfg.blindIntensity
  if (typeof cfg.roundTime === 'string') out.roundTime = cfg.roundTime
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

function newCode() {
  let code
  let tries = 0
  do {
    code = codeGen()
    tries++
  } while (rooms.has(code) && tries < 20)
  return code
}

function makeRoom(hostSocketId, hostName, avatar, config) {
  const code = newCode()
  const player = {
    id: hostSocketId, socketId: hostSocketId,
    sessionToken: tokenGen(),
    name: hostName, avatar: normalizeAvatar(avatar, hostName),
    isHost: true, ready: false, eliminated: false, disconnected: false,
  }
  const room = {
    code, hostId: hostSocketId,
    config: { ...sanitizeConfig(config) },
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
    roles: {},
    detectiveInterrogationUsedBy: null,
    interrogation: null,
    interrogationTimer: null,
    impostorGuessedWord: false,
    lastGuessRounds: {},   // socketId -> última ronda en que intentó adivinar
    disconnectTimers: {},   // playerId -> timeout
    voicePeers: new Set(),  // playerIds con chat de voz activo
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
      isHost: p.isHost, ready: p.ready,
      eliminated: p.eliminated, disconnected: !!p.disconnected,
    })),
    phase: room.phase, round: room.round,
    chatMessages: room.chatMessages,
    interrogation: interrogationPayloadFor(room.interrogation, viewerId),
  }
}

function privatePlayerPayload(player) {
  return {
    id: player.id,
    name: player.name,
    avatar: normalizeAvatar(player.avatar, player.name),
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
}

function buildInterrogationPayload(room, detective, target) {
  const now = Date.now()
  return {
    id: `${room.gameId || room.code}-${now}`,
    detectiveId: detective.id,
    detectiveName: detective.name,
    detectiveAvatar: normalizeAvatar(detective.avatar, detective.name),
    targetId: target.id,
    targetName: target.name,
    targetAvatar: normalizeAvatar(target.avatar, target.name),
    prompt: pickOne(INTERROGATION_PROMPTS),
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
  const impostorTeammates = impostorTeammatesFor(room, playerId)
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
      detectiveInterrogationUsed: room.detectiveInterrogationUsedBy === playerId,
    }
  }
  if (room.config.mode === 'blind') return { role: 'impostor-blind', word: room.fakeWord, clue: null, impostorTeammates: [] }
  if (room.config.mode === 'clue')  return { role: 'impostor-clue',  word: null, clue: room.clue, impostorTeammates }
  return { role: 'impostor', word: null, clue: null, impostorTeammates }
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
    if (payload) io.to(p.socketId).emit('game:yourRole', payload)
  })
}

function activePlayers(room) { return room.players.filter(p => !p.eliminated) }

function checkVictory(room) {
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
  return {
    gameId: room.gameId,
    winner: victory.winner, reason: victory.reason,
    impostorIds, word: room.word, fakeWord: room.fakeWord,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: normalizeAvatar(p.avatar, p.name),
      role: room.roles[p.id],
    })),
  }
}

function broadcastPlayers(room) {
  io.to(room.code).emit('room:players', { players: sanitizeRoom(room).players })
}

function assignHost(room) {
  if (!room.players.length) return null
  let host = room.players.find(p => p.id === room.hostId && !p.disconnected)
  if (!host) {
    host = room.players.find(p => !p.disconnected) || room.players[0]
    room.hostId = host.id
  }
  room.players.forEach(p => {
    p.isHost = p.id === room.hostId
  })
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
  io.to(room.code).emit('game:phase', { phase: 'discussion', speakOrder })
  io.to(room.code).emit('game:newRound', { round: room.round, speakOrder })
}

function resolveNoElimination(room, counts, reason) {
  io.to(room.code).emit('game:tie', { counts, reason })
  advanceToDiscussion(room)
}

function tryAdvanceReveal(room) {
  if (room.phase !== 'reveal') return
  if (room.players.every(p => p.ready)) {
    room.phase = 'discussion'
    const speakOrder = makeSpeakOrder(room)
    io.to(room.code).emit('game:phase', { phase: 'discussion', speakOrder })
  }
}

function afterPlayerListChanged(room) {
  if (room.phase !== 'lobby' && room.phase !== 'ended') {
    const v = checkVictory(room)
    if (v) {
      room.phase = 'ended'
      clearInterrogation(room)
      io.to(room.code).emit('game:over', gameOverPayload(room, v))
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
  broadcastPlayers(room)
  const v = checkVictory(room)
  if (v) {
    room.phase = 'ended'
    clearInterrogation(room)
    io.to(room.code).emit('game:over', gameOverPayload(room, v))
  } else {
    advanceToDiscussion(room)
  }
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

io.on('connection', (socket) => {

  socket.on('room:create', ({ hostName, avatar, config } = {}) => {
    if (!allow(socket.id, 2)) return
    const name = sanitizeName(hostName)
    if (!name) { socket.emit('room:error', { message: 'Nombre inválido' }); return }
    const room = makeRoom(socket.id, name, avatar, config || {})
    socket.join(room.code)
    socket.emit('room:created', {
      code: room.code,
      room: sanitizeRoom(room),
      you: privatePlayerPayload(room.players[0]),
    })
  })

  socket.on('room:join', ({ code, playerName, avatar } = {}) => {
    if (!allow(socket.id, 2)) return
    if (!isValidCode(code)) { socket.emit('room:error', { message: 'Código inválido' }); return }
    const name = sanitizeName(playerName)
    if (!name) { socket.emit('room:error', { message: 'Nombre inválido' }); return }
    const room = rooms.get(code.toUpperCase())
    if (!room) { socket.emit('room:error', { message: 'Sala no encontrada' }); return }
    if (room.players.length >= 12) { socket.emit('room:error', { message: 'Sala llena' }); return }
    if (room.phase !== 'lobby') { socket.emit('room:error', { message: 'La partida ya empezó' }); return }
    if (findPlayerByName(room, name)) { socket.emit('room:error', { message: 'Ese nombre ya está en la sala' }); return }
    const player = {
      id: socket.id, socketId: socket.id,
      sessionToken: tokenGen(),
      name, avatar: normalizeAvatar(avatar, name),
      isHost: false, ready: false, eliminated: false, disconnected: false,
    }
    room.players.push(player)
    socket.join(room.code)
    socket.emit('room:joined', { code: room.code, room: sanitizeRoom(room), you: privatePlayerPayload(player) })
    broadcastPlayers(room)
  })

  socket.on('room:resume', ({ code, name, sessionToken } = {}) => {
    if (!allow(socket.id, 1)) return
    if (!isValidCode(code)) {
      socket.emit('room:resumeFailed', { message: 'Codigo invalido' })
      return
    }
    const room = rooms.get(code.toUpperCase())
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
    assignHost(room)
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
      ...(rolePayloadFor(room, player.id) || {}),
    }
    socket.emit('room:resumed', { code: room.code, room: sanitizeRoom(room, player.id), you })
    broadcastPlayers(room)
  })

  socket.on('room:updateConfig', ({ config } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    room.config = { ...room.config, ...sanitizeConfig(config) }
    io.to(room.code).emit('room:config', { config: room.config })
  })

  socket.on('room:leave', () => leaveSocket(socket, true))

  socket.on('voice:join', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const player = getPlayerBySocket(room, socket.id)
    if (!player || player.disconnected) return

    if (!room.voicePeers) room.voicePeers = new Set()
    const wasAlreadyJoined = room.voicePeers.has(player.id)
    const peers = [...room.voicePeers].filter(peerId => peerId !== player.id)
    room.voicePeers.add(player.id)
    socket.emit('voice:peers', { peers })
    if (!wasAlreadyJoined) {
      peers.forEach(peerId => {
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
    assignRoles(room)
    room.phase = 'reveal'
    room.round = 1
    room.votes = {}; room.voters = {}
    room.eliminatedIds = []
    room.chatMessages = []
    room.detectiveInterrogationUsedBy = null
    room.impostorGuessedWord = false
    room.lastGuessRounds = {}
    room.players.forEach(p => { p.eliminated = false; p.ready = false })
    io.to(room.code).emit('game:started')
    emitYourRole(room)
  })

  socket.on('game:cardReady', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const player = getPlayerBySocket(room, socket.id)
    if (player) player.ready = true
    broadcastPlayers(room)
    tryAdvanceReveal(room)
  })

  socket.on('game:goToVote', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    clearInterrogation(room)
    room.phase = 'voting'
    room.votes = {}; room.voters = {}
    io.to(room.code).emit('game:phase', { phase: 'voting' })
  })

  socket.on('chat:message', ({ text } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.phase !== 'discussion') return
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
    const cleanText = sanitizeChatText(text)
    if (!cleanText) return

    const message = chatPayloadFor(player, cleanText)
    room.chatMessages = [...room.chatMessages, message].slice(-CHAT_MESSAGE_LIMIT)
    io.to(room.code).emit('chat:message', { message })
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

    room.detectiveInterrogationUsedBy = detective.id
    room.interrogation = buildInterrogationPayload(room, detective, target)
    room.players.forEach(player => {
      if (player.disconnected || !player.socketId) return
      io.to(player.socketId).emit('game:interrogationStarted', {
        interrogation: interrogationPayloadFor(room.interrogation, player.id),
      })
    })
    room.interrogationTimer = setTimeout(() => {
      clearInterrogation(room)
    }, INTERROGATION_DURATION_MS)
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
    room.voters[voter.id] = targetId
    recalculateVotes(room)
    emitVoteUpdate(room)
    tryResolveVotes(room)
  })

  socket.on('game:newRound', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    const player = getPlayerBySocket(room, socket.id)
    if (!room || !player || room.hostId !== player.id) return
    room.round += 1
    room.votes = {}; room.voters = {}
    room.phase = 'discussion'
    const speakOrder = makeSpeakOrder(room)
    io.to(room.code).emit('game:newRound', { round: room.round, speakOrder })
    io.to(room.code).emit('game:phase', { phase: 'discussion', speakOrder })
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
    room.roles = {}
    room.detectiveInterrogationUsedBy = null
    clearInterrogation(room, { emit: false })
    room.impostorGuessedWord = false
    room.lastGuessRounds = {}
    room.players.forEach(p => {
      p.eliminated = false
      p.ready = false
    })
    io.to(room.code).emit('room:rematch', { room: sanitizeRoom(room) })
  })

  socket.on('game:guessWord', ({ word } = {}) => {
    if (!allow(socket.id, 2)) return
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const player = getPlayerBySocket(room, socket.id)
    if (!player || !canGuessWord(room, player.id)) return
    if (room.phase === 'ended') return
    const lastRound = room.lastGuessRounds[player.id] ?? -1
    if (room.round - lastRound < 2) {
      socket.emit('game:guessBlocked', { availableAt: lastRound + 2 })
      return
    }
    const guess = (word || '').toString().trim().toLowerCase()
    if (!guess) return
    room.lastGuessRounds[player.id] = room.round
    const correct = guess === (room.word || '').toLowerCase()
    if (correct) {
      room.impostorGuessedWord = true
      const v = { winner: 'impostor', reason: 'wordGuessed' }
      room.phase = 'ended'
      clearInterrogation(room)
      io.to(room.code).emit('game:over', gameOverPayload(room, v))
    } else {
      io.to(room.code).emit('game:guessFailed', { playerId: player.id })
    }
  })

  socket.on('disconnect', () => leaveSocket(socket, false))
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

  // Lobby o ended o disconnect "hard": eliminar completamente
  if (hard || room.phase === 'ended') {
    room.players = room.players.filter(p => p.socketId !== socket.id)
    delete room.roles[player.id]
    if (room.interrogation && (room.interrogation.detectiveId === player.id || room.interrogation.targetId === player.id)) {
      clearInterrogation(room)
    }
    if (!room.players.length) {
      clearInterrogation(room, { emit: false })
      rooms.delete(room.code)
      return
    }
    const hostChanged = room.hostId === player.id
    const newHost = assignHost(room)
    broadcastPlayers(room)
    if (hostChanged) notifyHostAssigned(room, newHost)
    if (wasActiveGame) afterPlayerListChanged(room)
    return
  }

  // Partida en curso → marcar desconectado y dar gracia para reconexión
  player.disconnected = true
  const hostChanged = room.hostId === player.id
  const newHost = assignHost(room)
  broadcastPlayers(room)
  if (hostChanged) notifyHostAssigned(room, newHost)
  room.disconnectTimers[player.id] = setTimeout(() => {
    delete room.disconnectTimers[player.id]
    const stillThere = room.players.find(p => p.id === player.id)
    if (!stillThere || !stillThere.disconnected) return
    room.players = room.players.filter(p => p.id !== player.id)
    delete room.roles[player.id]
    if (room.interrogation && (room.interrogation.detectiveId === player.id || room.interrogation.targetId === player.id)) {
      clearInterrogation(room)
    }
    if (!room.players.length) {
      clearInterrogation(room, { emit: false })
      rooms.delete(room.code)
      return
    }
    const hostChanged = room.hostId === player.id
    const newHost = assignHost(room)
    broadcastPlayers(room)
    if (hostChanged) notifyHostAssigned(room, newHost)
    afterPlayerListChanged(room)
  }, RECONNECT_GRACE_MS)
}

server.listen(PORT, () => {
  console.log(`[el-impostor] server listening on :${PORT}`)
})
