import { create } from 'zustand'
import { io } from 'socket.io-client'
import { toast } from './toastStore.js'
import { sfx } from '../utils/sfx.js'
import { normalizeAvatar, rememberAvatarForName } from '../data/avatars.js'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const SESSION_KEY = 'el-impostor-online-session'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function saveSession(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch {}
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}
function isCurrentHost(players, myId, fallback = false) {
  const me = players.find(p => p.id === myId)
  return me ? !!me.isHost : fallback
}

export const useOnlineStore = create((set, get) => ({
  socket: null,
  connected: false,
  roomCode: null,
  isHost: false,
  myId: null,
  myName: '',
  myAvatar: null,
  players: [],          // [{ id, name, isHost, ready, eliminated }]
  config: null,
  phase: 'lobby',       // lobby | reveal | discussion | voting | voted | ended | spectator
  myRole: null,         // 'citizen' | 'impostor' | 'impostor-blind' | 'impostor-clue'
  myWord: null,
  myClue: null,
  votes: {},            // { targetId: count }
  votedFor: null,
  votersReady: 0,       // cuántos votaron
  result: null,         // { winner, reason, impostorIds, word, fakeWord }
  error: null,
  guessAttempts: 0,     // cuántas veces el impostor ha fallado adivinanza
  lastTie: null,        // { counts, at }

  connect: () => {
    if (get().socket) return
    const stored = loadSession()
    const socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: stored ? { resumeCode: stored.code, resumeName: stored.name, resumeToken: stored.sessionToken } : {},
    })

    socket.on('connect', () => {
      set({ connected: true, myId: socket.id })
      const s = loadSession()
      if (s?.code && s?.name && s?.sessionToken) {
        socket.emit('room:resume', { code: s.code, name: s.name, sessionToken: s.sessionToken })
      }
    })
    socket.on('disconnect', () => set({ connected: false }))
    socket.on('connect_error', (e) => {
      set({ error: `No se pudo conectar al servidor: ${e.message}` })
      toast.error('Sin conexión con el servidor', { title: 'Error', duration: 5000 })
    })

    socket.on('room:created', ({ code, room, you }) => {
      const myId = you?.id || socket.id
      const myName = you?.name || get().myName
      const myAvatar = normalizeAvatar(you?.avatar || get().myAvatar, myName)
      set({ roomCode: code, isHost: true, myId, myName, myAvatar, players: room.players, config: room.config, phase: 'lobby' })
      saveSession({ code, name: myName, avatar: myAvatar, sessionToken: you?.sessionToken })
    })
    socket.on('room:joined', ({ code, room, you }) => {
      const myId = you?.id || socket.id
      const myName = you?.name || get().myName
      const myAvatar = normalizeAvatar(you?.avatar || get().myAvatar, myName)
      set({ roomCode: code, isHost: false, myId, myName, myAvatar, players: room.players, config: room.config, phase: 'lobby' })
      saveSession({ code, name: myName, avatar: myAvatar, sessionToken: you?.sessionToken })
    })
    socket.on('room:resumed', ({ code, room, you }) => {
      set({
        roomCode: code,
        isHost: !!you?.isHost,
        players: room.players,
        config: room.config,
        phase: room.phase || 'lobby',
        myId: socket.id,
        myName: you?.name || get().myName,
        myAvatar: normalizeAvatar(you?.avatar || get().myAvatar, you?.name || get().myName),
      })
      saveSession({
        code,
        name: you?.name || get().myName,
        avatar: normalizeAvatar(you?.avatar || get().myAvatar, you?.name || get().myName),
        sessionToken: you?.sessionToken,
      })
      if (you?.role) {
        set({ myRole: you.role, myWord: you.word ?? null, myClue: you.clue ?? null })
      }
      toast.success('Te reconectaste a la sala', { duration: 2500 })
    })
    socket.on('room:players', ({ players }) => {
      const { myId, isHost } = get()
      set({ players, isHost: isCurrentHost(players, myId, isHost) })
    })
    socket.on('room:config', ({ config }) => set({ config }))
    socket.on('room:error', ({ message }) => {
      set({ error: message })
      toast.error(message || 'Error en la sala', { title: 'Sala' })
    })

    socket.on('game:started', () => set({ phase: 'reveal', votes: {}, votedFor: null, guessAttempts: 0, lastTie: null }))
    socket.on('game:yourRole', ({ role, word, clue }) => {
      set({ myRole: role, myWord: word, myClue: clue })
    })
    socket.on('game:phase', ({ phase }) => set({ phase }))
    socket.on('vote:update', ({ votes, votersReady }) => set({ votes, votersReady }))
    socket.on('game:eliminated', ({ playerId, wasImpostor, name }) => {
      set((s) => {
        const players = s.players.map(p => p.id === playerId ? { ...p, eliminated: true } : p)
        const youOut = playerId === s.myId
        return { players, ...(youOut ? { phase: 'spectator' } : {}) }
      })
      sfx.eliminate()
      toast.info(
        wasImpostor ? `${name || 'El sospechoso'} era impostor` : `${name || 'El sospechoso'} era inocente`,
        { kind: wasImpostor ? 'success' : 'warn', duration: 3600 }
      )
    })
    socket.on('game:tie', ({ counts, reason }) => {
      set({ lastTie: { counts, at: Date.now() } })
      sfx.tie()
      if (reason === 'noMajority') {
        toast.warn('Sin mayoria. Nueva ronda de discusion.', { duration: 3500 })
        return
      }
      toast.warn('Empate. Nueva ronda de discusión.', { duration: 3500 })
    })
    socket.on('game:guessFailed', ({ socketId }) => {
      const { myId } = get()
      if (socketId === myId) {
        set((s) => ({ guessAttempts: s.guessAttempts + 1 }))
        toast.error('Palabra incorrecta', { duration: 3000 })
      } else {
        toast.info('Un impostor intentó adivinar... y falló', { duration: 3000 })
      }
    })
    socket.on('game:over', (result) => {
      set({ phase: 'ended', result })
      if (result?.winner === 'citizens') sfx.winCitizens()
      else if (result?.winner === 'impostor') sfx.winImpostor()
    })
    socket.on('game:newRound', () => set({ votes: {}, votedFor: null, phase: 'discussion' }))
    socket.on('room:rematch', ({ room }) => {
      set({
        phase: 'lobby',
        players: room.players,
        config: room.config,
        isHost: isCurrentHost(room.players, get().myId, get().isHost),
        myRole: null, myWord: null, myClue: null,
        votes: {}, votedFor: null, votersReady: 0,
        result: null, guessAttempts: 0, lastTie: null,
      })
      saveSession({ ...loadSession(), code: get().roomCode, name: get().myName })
      toast.success('Nueva partida en la misma sala', { duration: 2500 })
    })

    set({ socket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
    }
    clearSession()
    set({ socket: null, connected: false, roomCode: null, isHost: false, players: [], phase: 'lobby', myRole: null, myWord: null, myAvatar: null })
  },

  createRoom: (hostName, config, avatar) => {
    const myAvatar = normalizeAvatar(avatar, hostName)
    rememberAvatarForName(hostName, myAvatar)
    set({ myName: hostName, myAvatar, error: null })
    get().socket?.emit('room:create', { hostName, avatar: myAvatar, config })
  },

  joinRoom: (code, playerName, avatar) => {
    const myAvatar = normalizeAvatar(avatar, playerName)
    rememberAvatarForName(playerName, myAvatar)
    set({ myName: playerName, myAvatar, error: null })
    get().socket?.emit('room:join', { code: code.toUpperCase(), playerName, avatar: myAvatar })
  },

  leaveRoom: () => {
    get().socket?.emit('room:leave')
    clearSession()
    set({ roomCode: null, isHost: false, players: [], phase: 'lobby', myRole: null, myWord: null, votes: {}, votedFor: null })
  },

  startGame: () => {
    get().socket?.emit('room:startGame')
  },

  cardReady: () => {
    get().socket?.emit('game:cardReady')
  },

  goToVote: () => {
    get().socket?.emit('game:goToVote')
  },

  castVote: (targetId) => {
    get().socket?.emit('vote:cast', { targetId })
    set({ votedFor: targetId, phase: 'voted' })
  },

  guessWord: (word) => {
    get().socket?.emit('game:guessWord', { word })
  },

  rematch: () => {
    get().socket?.emit('room:rematch')
  },

  newRound: () => {
    get().socket?.emit('game:newRound')
  },

  setConfig: (patch) => {
    const cfg = { ...(get().config || {}), ...patch }
    set({ config: cfg })
    get().socket?.emit('room:updateConfig', { config: cfg })
  },

  clearError: () => set({ error: null }),
}))
