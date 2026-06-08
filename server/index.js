import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { customAlphabet } from 'nanoid'
import { wordBank, categories, relatedWords } from './wordBank.js'

const app = express()
app.use(cors())
app.get('/', (_, res) => res.json({ ok: true, app: 'el-impostor', version: '1.1' }))
app.get('/health', (_, res) => res.json({ ok: true, rooms: rooms.size }))

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

const PORT = process.env.PORT || 3001
const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)
const tokenGen = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 24)

const rooms = new Map() // code -> Room
const RECONNECT_GRACE_MS = 60_000

// --- rate limiting (token bucket por socket) ---
const buckets = new Map() // socketId -> { tokens, last }
const BUCKET_MAX = 40
const BUCKET_REFILL_PER_SEC = 12
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

// --- helpers de validación ---
function sanitizeName(raw) {
  if (typeof raw !== 'string') return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, 16)
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
  if (Number.isFinite(cfg.impostorCount)) out.impostorCount = Math.max(1, Math.min(4, Math.floor(cfg.impostorCount)))
  if (typeof cfg.clueType === 'string' && ['category','firstLetter','wordLength','vague','custom'].includes(cfg.clueType)) out.clueType = cfg.clueType
  if (typeof cfg.customClue === 'string') out.customClue = cfg.customClue.slice(0, 80)
  if (typeof cfg.blindIntensity === 'string' && ['near','medium','far'].includes(cfg.blindIntensity)) out.blindIntensity = cfg.blindIntensity
  if (typeof cfg.roundTime === 'string') out.roundTime = cfg.roundTime
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

function makeRoom(hostSocketId, hostName, config) {
  const code = newCode()
  const player = {
    id: hostSocketId, socketId: hostSocketId,
    sessionToken: tokenGen(),
    name: hostName, isHost: true, ready: false, eliminated: false, disconnected: false,
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
    roles: {},
    impostorGuessedWord: false,
    disconnectTimers: {},   // playerId -> timeout
  }
  rooms.set(code, room)
  return room
}

function sanitizeRoom(room) {
  return {
    code: room.code,
    config: room.config,
    players: room.players.map(p => ({
      id: p.id, name: p.name, isHost: p.isHost, ready: p.ready,
      eliminated: p.eliminated, disconnected: !!p.disconnected,
    })),
    phase: room.phase, round: room.round,
  }
}

function privatePlayerPayload(player) {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    sessionToken: player.sessionToken,
  }
}

function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.socketId === socketId)) return room
  }
  return null
}

function assignRoles(room) {
  const cfg = room.config
  const catKey = cfg.category === 'random' || !cfg.category
    ? pickOne(Object.keys(wordBank))
    : (wordBank[cfg.category] ? cfg.category : pickOne(Object.keys(wordBank)))
  const words = wordBank[catKey]
  const word = pickOne(words)
  room.category = catKey
  room.word = word

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
  const maxImpostors = Math.max(1, Math.floor(room.players.length / 3))
  const impostorCount = Math.max(1, Math.min(cfg.impostorCount || 1, maxImpostors))
  const impostorIdx = new Set(indices.slice(0, impostorCount))

  room.roles = {}
  room.players.forEach((p, i) => {
    const isImpostor = impostorIdx.has(i)
    room.roles[p.id] = isImpostor ? 'impostor' : 'citizen'
  })
}

function rolePayloadFor(room, playerId) {
  const role = room.roles[playerId]
  if (!role) return null
  if (role === 'citizen') return { role: 'citizen', word: room.word, clue: null }
  if (room.config.mode === 'blind') return { role: 'impostor-blind', word: room.fakeWord, clue: null }
  if (room.config.mode === 'clue')  return { role: 'impostor-clue',  word: null, clue: room.clue }
  return { role: 'impostor', word: null, clue: null }
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
  const activeImpostors = active.filter(p => room.roles[p.id] === 'impostor')
  const activeCitizens = active.filter(p => room.roles[p.id] === 'citizen')
  if (activeImpostors.length === 0) return { winner: 'citizens', reason: 'allImpostorsCaught' }
  if (activeImpostors.length >= activeCitizens.length) return { winner: 'impostor', reason: 'majority' }
  return null
}

function gameOverPayload(room, victory) {
  const impostorIds = Object.entries(room.roles).filter(([, r]) => r === 'impostor').map(([id]) => id)
  return {
    winner: victory.winner, reason: victory.reason,
    impostorIds, word: room.word, fakeWord: room.fakeWord,
    players: room.players.map(p => ({ id: p.id, name: p.name, role: room.roles[p.id] })),
  }
}

function broadcastPlayers(room) {
  io.to(room.code).emit('room:players', { players: sanitizeRoom(room).players })
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
  io.to(room.code).emit('game:phase', { phase: 'discussion' })
  io.to(room.code).emit('game:newRound', { round: room.round })
}

function resolveNoElimination(room, counts, reason) {
  io.to(room.code).emit('game:tie', { counts, reason })
  advanceToDiscussion(room)
}

function tryAdvanceReveal(room) {
  if (room.phase !== 'reveal') return
  if (room.players.every(p => p.ready)) {
    room.phase = 'discussion'
    io.to(room.code).emit('game:phase', { phase: 'discussion' })
  }
}

function afterPlayerListChanged(room) {
  if (room.phase !== 'lobby' && room.phase !== 'ended') {
    const v = checkVictory(room)
    if (v) {
      room.phase = 'ended'
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
    wasImpostor: room.roles[eliminatedId] === 'impostor',
    name: player?.name,
  })
  broadcastPlayers(room)
  const v = checkVictory(room)
  if (v) {
    room.phase = 'ended'
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

  socket.on('room:create', ({ hostName, config } = {}) => {
    if (!allow(socket.id, 2)) return
    const name = sanitizeName(hostName)
    if (!name) { socket.emit('room:error', { message: 'Nombre inválido' }); return }
    const room = makeRoom(socket.id, name, config || {})
    socket.join(room.code)
    socket.emit('room:created', {
      code: room.code,
      room: sanitizeRoom(room),
      you: privatePlayerPayload(room.players[0]),
    })
  })

  socket.on('room:join', ({ code, playerName } = {}) => {
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
      name, isHost: false, ready: false, eliminated: false, disconnected: false,
    }
    room.players.push(player)
    socket.join(room.code)
    socket.emit('room:joined', { code: room.code, room: sanitizeRoom(room), you: privatePlayerPayload(player) })
    broadcastPlayers(room)
  })

  socket.on('room:resume', ({ code, name, sessionToken } = {}) => {
    if (!allow(socket.id, 1)) return
    if (!isValidCode(code)) return
    const room = rooms.get(code.toUpperCase())
    if (!room) return
    const player = findPlayerForResume(room, name, sessionToken)
    if (!player) return
    if (!player.disconnected && player.socketId !== socket.id) {
      // Otra sesión activa con ese nombre; no robar
      return
    }
    if (room.disconnectTimers[player.id]) {
      clearTimeout(room.disconnectTimers[player.id])
      delete room.disconnectTimers[player.id]
    }
    // re-mapear socket
    const oldId = player.id
    player.id = socket.id
    player.socketId = socket.id
    player.disconnected = false
    if (room.hostId === oldId) room.hostId = socket.id
    if (room.roles[oldId]) {
      room.roles[socket.id] = room.roles[oldId]
      delete room.roles[oldId]
    }
    if (room.voters[oldId]) {
      room.voters[socket.id] = room.voters[oldId]
      delete room.voters[oldId]
    }
    Object.entries(room.voters).forEach(([voterId, targetId]) => {
      if (targetId === oldId) room.voters[voterId] = socket.id
    })
    if (room.phase === 'voting') {
      recalculateVotes(room)
      emitVoteUpdate(room)
    }
    socket.join(room.code)
    const you = {
      ...privatePlayerPayload(player),
      ...(rolePayloadFor(room, socket.id) || {}),
    }
    socket.emit('room:resumed', { code: room.code, room: sanitizeRoom(room), you })
    broadcastPlayers(room)
  })

  socket.on('room:updateConfig', ({ config } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.hostId !== socket.id) return
    room.config = { ...room.config, ...sanitizeConfig(config) }
    io.to(room.code).emit('room:config', { config: room.config })
  })

  socket.on('room:leave', () => leaveSocket(socket, true))

  socket.on('room:startGame', () => {
    if (!allow(socket.id, 2)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.hostId !== socket.id) return
    if (room.players.length < 3) {
      socket.emit('room:error', { message: 'Se necesitan al menos 3 jugadores' })
      return
    }
    assignRoles(room)
    room.phase = 'reveal'
    room.round = 1
    room.votes = {}; room.voters = {}
    room.eliminatedIds = []
    room.impostorGuessedWord = false
    room.players.forEach(p => { p.eliminated = false; p.ready = false })
    io.to(room.code).emit('game:started')
    emitYourRole(room)
  })

  socket.on('game:cardReady', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (player) player.ready = true
    broadcastPlayers(room)
    tryAdvanceReveal(room)
  })

  socket.on('game:goToVote', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.hostId !== socket.id) return
    room.phase = 'voting'
    room.votes = {}; room.voters = {}
    io.to(room.code).emit('game:phase', { phase: 'voting' })
  })

  socket.on('vote:cast', ({ targetId } = {}) => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.phase !== 'voting') return
    const voter = room.players.find(p => p.id === socket.id)
    if (!voter || voter.eliminated) return
    if (room.voters[socket.id]) return
    if (socket.id === targetId) return
    const target = room.players.find(p => p.id === targetId)
    if (!target || target.eliminated) return
    room.voters[socket.id] = targetId
    recalculateVotes(room)
    emitVoteUpdate(room)
    tryResolveVotes(room)
  })

  socket.on('game:newRound', () => {
    if (!allow(socket.id, 1)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.hostId !== socket.id) return
    room.round += 1
    room.votes = {}; room.voters = {}
    room.phase = 'discussion'
    io.to(room.code).emit('game:newRound', { round: room.round })
    io.to(room.code).emit('game:phase', { phase: 'discussion' })
  })

  socket.on('room:rematch', () => {
    if (!allow(socket.id, 2)) return
    const room = getRoomBySocket(socket.id)
    if (!room || room.hostId !== socket.id) return
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
    room.roles = {}
    room.impostorGuessedWord = false
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
    if (room.roles[socket.id] !== 'impostor') return
    if (room.phase === 'ended') return
    const guess = (word || '').toString().trim().toLowerCase()
    if (!guess) return
    const correct = guess === (room.word || '').toLowerCase()
    if (correct) {
      room.impostorGuessedWord = true
      const v = { winner: 'impostor', reason: 'wordGuessed' }
      room.phase = 'ended'
      io.to(room.code).emit('game:over', gameOverPayload(room, v))
    } else {
      io.to(room.code).emit('game:guessFailed', { socketId: socket.id })
    }
  })

  socket.on('disconnect', () => leaveSocket(socket, false))
})

function leaveSocket(socket, hard) {
  const room = getRoomBySocket(socket.id)
  buckets.delete(socket.id)
  if (!room) return
  const player = room.players.find(p => p.socketId === socket.id)
  if (!player) return
  const wasActiveGame = room.phase !== 'lobby' && room.phase !== 'ended'

  // Lobby o ended o disconnect "hard": eliminar completamente
  if (hard || room.phase === 'lobby' || room.phase === 'ended') {
    room.players = room.players.filter(p => p.socketId !== socket.id)
    delete room.roles[player.id]
    if (!room.players.length) { rooms.delete(room.code); return }
    if (room.hostId === player.id) {
      const newHost = room.players[0]
      room.hostId = newHost.id
      newHost.isHost = true
    }
    broadcastPlayers(room)
    if (wasActiveGame) afterPlayerListChanged(room)
    return
  }

  // Partida en curso → marcar desconectado y dar gracia para reconexión
  player.disconnected = true
  broadcastPlayers(room)
  room.disconnectTimers[player.id] = setTimeout(() => {
    delete room.disconnectTimers[player.id]
    const stillThere = room.players.find(p => p.id === player.id)
    if (!stillThere || !stillThere.disconnected) return
    room.players = room.players.filter(p => p.id !== player.id)
    delete room.roles[player.id]
    if (!room.players.length) { rooms.delete(room.code); return }
    if (room.hostId === player.id) {
      const newHost = room.players[0]
      room.hostId = newHost.id
      newHost.isHost = true
    }
    broadcastPlayers(room)
    afterPlayerListChanged(room)
  }, RECONNECT_GRACE_MS)
}

server.listen(PORT, () => {
  console.log(`[el-impostor] server listening on :${PORT}`)
})
