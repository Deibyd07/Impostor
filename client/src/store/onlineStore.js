import { create } from 'zustand'
import { io } from 'socket.io-client'
import { toast } from './toastStore.js'
import { sfx } from '../utils/sfx.js'

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

export const useOnlineStore = create((set, get) => ({
  socket: null,
  connected: false,
  roomCode: null,
  isHost: false,
  myId: null,
  myName: '',
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
  round: 1,             // ronda actual
  lastGuessRound: -1,   // ronda del último intento de adivinanza (-1 = nunca)
  speakOrder: [],       // ids de jugadores en orden aleatorio de turno
  lastTie: null,        // { counts, at }

  connect: () => {
    if (get().socket) return
    const stored = loadSession()
    const socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: stored ? { resumeCode: stored.code, resumeName: stored.name } : {},
    })

    socket.on('connect', () => {
      set({ connected: true, myId: socket.id })
      const s = loadSession()
      if (s?.code && s?.name) {
        socket.emit('room:resume', { code: s.code, name: s.name })
      }
    })
    socket.on('disconnect', () => set({ connected: false }))
    socket.on('connect_error', (e) => {
      set({ error: `No se pudo conectar al servidor: ${e.message}` })
      toast.error('Sin conexión con el servidor', { title: 'Error', duration: 5000 })
    })

    socket.on('room:created', ({ code, room }) => {
      set({ roomCode: code, isHost: true, players: room.players, config: room.config, phase: 'lobby' })
      saveSession({ code, name: get().myName })
    })
    socket.on('room:joined', ({ code, room }) => {
      set({ roomCode: code, isHost: false, players: room.players, config: room.config, phase: 'lobby' })
      saveSession({ code, name: get().myName })
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
      })
      if (you?.role) {
        set({ myRole: you.role, myWord: you.word ?? null, myClue: you.clue ?? null })
      }
      toast.success('Te reconectaste a la sala', { duration: 2500 })
    })
    socket.on('room:players', ({ players }) => set({ players }))
    socket.on('room:config', ({ config }) => set({ config }))
    socket.on('room:error', ({ message }) => {
      set({ error: message })
      toast.error(message || 'Error en la sala', { title: 'Sala' })
    })

    socket.on('game:started', () => set({ phase: 'reveal', votes: {}, votedFor: null, guessAttempts: 0, round: 1, lastGuessRound: -1, speakOrder: [], lastTie: null }))
    socket.on('game:yourRole', ({ role, word, clue }) => {
      set({ myRole: role, myWord: word, myClue: clue })
    })
    socket.on('game:phase', ({ phase, speakOrder }) => set(speakOrder ? { phase, speakOrder } : { phase }))
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
    socket.on('game:tie', ({ counts }) => {
      set({ lastTie: { counts, at: Date.now() } })
      sfx.tie()
      toast.warn('Empate. Nueva ronda de discusión.', { duration: 3500 })
    })
    socket.on('game:guessFailed', ({ socketId }) => {
      const { myId } = get()
      if (socketId === myId) {
        set((s) => ({ guessAttempts: s.guessAttempts + 1, lastGuessRound: s.round }))
        toast.error('Palabra incorrecta', { duration: 3000 })
      } else {
        toast.info('Un impostor intentó adivinar... y falló', { duration: 3000 })
      }
    })
    socket.on('game:guessBlocked', ({ availableAt }) => {
      toast.warn(`Podrás adivinar en la ronda ${availableAt}`, { duration: 3500 })
    })
    socket.on('game:over', (result) => {
      set({ phase: 'ended', result })
      if (result?.winner === 'citizens') sfx.winCitizens()
      else if (result?.winner === 'impostor') sfx.winImpostor()
    })
    socket.on('game:newRound', ({ round, speakOrder }) => set({ votes: {}, votedFor: null, phase: 'discussion', round, ...(speakOrder ? { speakOrder } : {}) }))
    socket.on('room:rematch', ({ room }) => {
      set({
        phase: 'lobby',
        players: room.players,
        config: room.config,
        myRole: null, myWord: null, myClue: null,
        votes: {}, votedFor: null, votersReady: 0,
        result: null, guessAttempts: 0, round: 1, lastGuessRound: -1, lastTie: null,
      })
      saveSession({ code: get().roomCode, name: get().myName })
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
    set({ socket: null, connected: false, roomCode: null, players: [], phase: 'lobby', myRole: null, myWord: null })
  },

  createRoom: (hostName, config) => {
    set({ myName: hostName, error: null })
    get().socket?.emit('room:create', { hostName, config })
  },

  joinRoom: (code, playerName) => {
    set({ myName: playerName, error: null })
    get().socket?.emit('room:join', { code: code.toUpperCase(), playerName })
  },

  leaveRoom: () => {
    get().socket?.emit('room:leave')
    clearSession()
    set({ roomCode: null, players: [], phase: 'lobby', myRole: null, myWord: null, votes: {}, votedFor: null })
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
