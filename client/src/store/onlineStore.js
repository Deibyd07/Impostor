import { create } from 'zustand'
import { io } from 'socket.io-client'
import { toast } from './toastStore.js'
import { sfx } from '../utils/sfx.js'
import { normalizeAvatar, rememberAvatarForName } from '../data/avatars.js'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const SESSION_KEY = 'el-impostor-online-session'
const CHAT_MESSAGE_LIMIT = 50
const INTERROGATION_CLEAR_GRACE_MS = 1500

let interrogationClearTimer = null

function clearInterrogationClearTimer() {
  if (!interrogationClearTimer) return
  clearTimeout(interrogationClearTimer)
  interrogationClearTimer = null
}

function scheduleInterrogationClear(interrogation, set) {
  clearInterrogationClearTimer()
  if (!interrogation?.id || !interrogation.expiresAt) return
  const delay = Math.max(0, interrogation.expiresAt - Date.now() + INTERROGATION_CLEAR_GRACE_MS)
  interrogationClearTimer = setTimeout(() => {
    set((s) => (
      !s.detectiveInterrogation || s.detectiveInterrogation.id === interrogation.id
        ? { detectiveInterrogation: null }
        : s
    ))
    interrogationClearTimer = null
  }, delay)
}

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
  myRole: null,         // 'citizen' | 'detective' | 'impostor' | 'impostor-blind' | 'impostor-clue'
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
  chatMessages: [],
  detectiveInterrogation: null,
  detectiveInterrogationUsed: false,
  eliminationReveal: null,
  clearEliminationReveal: () => set({ eliminationReveal: null }),

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
      set({
        roomCode: code, isHost: true, myId, myName, myAvatar,
        players: room.players, config: room.config, phase: 'lobby',
        chatMessages: room.chatMessages || [],
        detectiveInterrogation: room.interrogation || null,
        detectiveInterrogationUsed: false,
        eliminationReveal: null,
      })
      saveSession({ code, name: myName, avatar: myAvatar, sessionToken: you?.sessionToken })
    })
    socket.on('room:joined', ({ code, room, you }) => {
      const myId = you?.id || socket.id
      const myName = you?.name || get().myName
      const myAvatar = normalizeAvatar(you?.avatar || get().myAvatar, myName)
      set({
        roomCode: code, isHost: false, myId, myName, myAvatar,
        players: room.players, config: room.config, phase: 'lobby',
        chatMessages: room.chatMessages || [],
        detectiveInterrogation: room.interrogation || null,
        detectiveInterrogationUsed: false,
        eliminationReveal: null,
      })
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
        chatMessages: room.chatMessages || [],
        detectiveInterrogation: room.interrogation || null,
        eliminationReveal: null,
      })
      scheduleInterrogationClear(room.interrogation, set)
      saveSession({
        code,
        name: you?.name || get().myName,
        avatar: normalizeAvatar(you?.avatar || get().myAvatar, you?.name || get().myName),
        sessionToken: you?.sessionToken,
      })
      if (you?.role) {
        set({
          myRole: you.role,
          myWord: you.word ?? null,
          myClue: you.clue ?? null,
          detectiveInterrogationUsed: !!you.detectiveInterrogationUsed,
        })
      }
      toast.success('Te reconectaste a la sala', { duration: 2500 })
    })
    socket.on('room:players', ({ players }) => {
      const { myId, isHost } = get()
      set({ players, isHost: isCurrentHost(players, myId, isHost) })
    })
    socket.on('room:hostAssigned', ({ room }) => {
      scheduleInterrogationClear(room?.interrogation, set)
      set({
        isHost: true,
        players: room?.players || get().players,
        config: room?.config || get().config,
        phase: room?.phase || get().phase,
        detectiveInterrogation: room?.interrogation || get().detectiveInterrogation,
      })
      toast.success('Ahora eres el anfitrion', { duration: 3000 })
    })
    socket.on('room:config', ({ config }) => set({ config }))
    socket.on('room:error', ({ message }) => {
      set({ error: message })
      toast.error(message || 'Error en la sala', { title: 'Sala' })
    })

    socket.on('game:started', () => {
      sfx.startGame()
      clearInterrogationClearTimer()
      set({
        phase: 'reveal',
        votes: {},
        votedFor: null,
        guessAttempts: 0,
        round: 1,
        lastGuessRound: -1,
        speakOrder: [],
        lastTie: null,
        chatMessages: [],
        detectiveInterrogation: null,
        detectiveInterrogationUsed: false,
        eliminationReveal: null,
      })
    })
    socket.on('game:yourRole', ({ role, word, clue, detectiveInterrogationUsed }) => {
      set({ myRole: role, myWord: word, myClue: clue, detectiveInterrogationUsed: !!detectiveInterrogationUsed })
    })
    socket.on('game:phase', ({ phase, speakOrder }) => {
      const update = {
        phase,
        ...(speakOrder ? { speakOrder } : {}),
        ...(phase !== 'discussion' ? { detectiveInterrogation: null } : {}),
      }
      if (phase === 'voting') update.votersReady = 0
      if (phase !== 'discussion') clearInterrogationClearTimer()
      set(update)
      if (phase === 'voting') sfx.startVoting()
    })
    socket.on('vote:update', ({ votes, votersReady }) => set({ votes, votersReady }))
    socket.on('chat:message', ({ message }) => {
      if (!message?.id) return
      set((s) => ({ chatMessages: [...s.chatMessages, message].slice(-CHAT_MESSAGE_LIMIT) }))
      if (message.playerId !== get().myId) sfx.chatMessage()
    })
    socket.on('chat:error', ({ message }) => {
      toast.warn(message || 'No se pudo enviar el mensaje', { duration: 2500 })
    })
    socket.on('game:interrogationStarted', ({ interrogation }) => {
      if (!interrogation?.id) return
      set((s) => ({
        detectiveInterrogation: interrogation,
        detectiveInterrogationUsed: s.detectiveInterrogationUsed || interrogation.detectiveId === s.myId,
      }))
      scheduleInterrogationClear(interrogation, set)
      sfx.startInterrogation()
      toast.info(`Interrogatorio a ${interrogation.targetName}`, { duration: 3000 })
    })
    socket.on('game:interrogationEnded', ({ id }) => {
      clearInterrogationClearTimer()
      set((s) => (
        !s.detectiveInterrogation || s.detectiveInterrogation.id === id
          ? { detectiveInterrogation: null }
          : s
      ))
    })
    socket.on('game:detectiveError', ({ message }) => {
      toast.warn(message || 'No se pudo iniciar el interrogatorio', { duration: 3000 })
    })
    socket.on('game:eliminated', ({ playerId, wasImpostor, name }) => {
      set((s) => {
        const eliminated = s.players.find(p => p.id === playerId)
        const players = s.players.map(p => p.id === playerId ? { ...p, eliminated: true } : p)
        const youOut = playerId === s.myId
        return {
          players,
          eliminationReveal: {
            id: `${playerId}-${Date.now()}`,
            playerId,
            name: name || eliminated?.name || 'Jugador eliminado',
            avatar: eliminated?.avatar,
            wasImpostor: !!wasImpostor,
          },
          ...(youOut ? { phase: 'spectator' } : {}),
        }
      })
      sfx.eliminate({ wasImpostor })
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
      sfx.guessWrong()
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
      clearInterrogationClearTimer()
      set({ phase: 'ended', result, detectiveInterrogation: null })
      if (result?.winner === 'impostor' && result?.reason === 'wordGuessed') sfx.guessCorrect()
    })
    socket.on('game:newRound', ({ round, speakOrder }) => set({ votes: {}, votedFor: null, phase: 'discussion', round, ...(speakOrder ? { speakOrder } : {}) }))
    socket.on('room:rematch', ({ room }) => {
      set({
        phase: 'lobby',
        players: room.players,
        config: room.config,
        isHost: isCurrentHost(room.players, get().myId, get().isHost),
        myRole: null, myWord: null, myClue: null,
        votes: {}, votedFor: null, votersReady: 0,
        result: null, guessAttempts: 0, round: 1, lastGuessRound: -1, speakOrder: [], lastTie: null,
        chatMessages: room.chatMessages || [],
        detectiveInterrogation: room.interrogation || null,
        detectiveInterrogationUsed: false,
        eliminationReveal: null,
      })
      scheduleInterrogationClear(room.interrogation, set)
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
    clearInterrogationClearTimer()
    set({
      socket: null,
      connected: false,
      roomCode: null,
      isHost: false,
      players: [],
      phase: 'lobby',
      myRole: null,
      myWord: null,
      myAvatar: null,
      chatMessages: [],
      detectiveInterrogation: null,
      detectiveInterrogationUsed: false,
      eliminationReveal: null,
    })
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
    clearInterrogationClearTimer()
    set({
      roomCode: null,
      isHost: false,
      players: [],
      phase: 'lobby',
      myRole: null,
      myWord: null,
      votes: {},
      votedFor: null,
      chatMessages: [],
      detectiveInterrogation: null,
      detectiveInterrogationUsed: false,
      eliminationReveal: null,
    })
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
    sfx.voteCast()
    set((s) => ({ votedFor: targetId, phase: 'voted', votersReady: s.votersReady + 1 }))
  },

  guessWord: (word) => {
    get().socket?.emit('game:guessWord', { word })
  },

  sendChatMessage: (text) => {
    get().socket?.emit('chat:message', { text })
  },

  startDetectiveInterrogation: (targetId) => {
    get().socket?.emit('game:detectiveInterrogate', { targetId })
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
