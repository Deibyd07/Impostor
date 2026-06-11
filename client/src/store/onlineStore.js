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

function currentPlayer(state) {
  return state.players.find(player => player.id === state.myId) || null
}

function isCurrentPlayerOut(state) {
  const me = currentPlayer(state)
  return !!me?.eliminated || !!me?.disconnected
}

function phaseForCurrentPlayer(state, phase) {
  const me = currentPlayer(state)
  if (me?.eliminated && phase !== 'lobby' && phase !== 'ended') return 'spectator'
  return phase
}

export const useOnlineStore = create((set, get) => ({
  socket: null,
  connected: false,
  resumePending: false,
  roomCode: null,
  isHost: false,
  myId: null,
  myName: '',
  myAvatar: null,
  myProfileId: null,
  isGuest: true,
  players: [],          // [{ id, name, isHost, ready, eliminated }]
  config: null,
  phase: 'lobby',       // lobby | caseIntro | reveal | discussion | voting | voted | roundResult | ended | spectator
  myRole: null,         // 'citizen' | 'detective' | 'detective-impostor' | 'impostor' | 'impostor-blind' | 'impostor-clue'
  myWord: null,
  myClue: null,
  myAlibi: null,
  alibiCase: null,
  alibiRoundResult: null,
  alibiScoreboard: [],
  myPartyLine: null,
  partyLine: null,
  partyLineRound: null,
  partyLineResult: null,
  partyLineScoreboard: [],
  partyLineCalls: [],
  myImpostorTeammates: [],
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
  impostorChatMessages: [],
  impostorLastGuessRound: -1,
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
      const s = loadSession()
      if (s?.code && s?.name && s?.sessionToken) {
        set({ connected: true, resumePending: true })
        socket.emit('room:resume', { code: s.code, name: s.name, sessionToken: s.sessionToken })
      } else {
        set({ connected: true, resumePending: false })
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
        myProfileId: you?.profileId || null,
        isGuest: you?.isGuest !== false || !you?.profileId,
        players: room.players, config: room.config, phase: 'lobby',
        votes: room.votes || {},
        votersReady: room.votersReady || 0,
        round: room.round || 1,
        speakOrder: room.speakOrder || [],
        lastTie: room.lastTie || null,
        chatMessages: room.chatMessages || [],
        alibiCase: room.alibiCase || null,
        alibiRoundResult: room.alibiRoundResult || null,
        alibiScoreboard: room.alibiScoreboard || [],
        partyLine: room.partyLine || null,
        partyLineRound: room.partyLineRound || null,
        partyLineResult: room.partyLineResult || null,
        partyLineScoreboard: room.partyLineScoreboard || [],
        partyLineCalls: room.partyLineCalls || [],
        myPartyLine: null,
        impostorChatMessages: room.impostorChatMessages || [],
        impostorLastGuessRound: Number.isFinite(room.impostorLastGuessRound) ? room.impostorLastGuessRound : -1,
        detectiveInterrogation: room.interrogation || null,
        detectiveInterrogationUsed: false,
        myImpostorTeammates: [],
        result: room.result || null,
        eliminationReveal: null,
        resumePending: false,
      })
      saveSession({ code, name: myName, avatar: myAvatar, profileId: you?.profileId || null, isGuest: you?.isGuest !== false || !you?.profileId, sessionToken: you?.sessionToken })
    })
    socket.on('room:joined', ({ code, room, you }) => {
      const myId = you?.id || socket.id
      const myName = you?.name || get().myName
      const myAvatar = normalizeAvatar(you?.avatar || get().myAvatar, myName)
      set({
        roomCode: code, isHost: false, myId, myName, myAvatar,
        myProfileId: you?.profileId || null,
        isGuest: you?.isGuest !== false || !you?.profileId,
        players: room.players, config: room.config, phase: 'lobby',
        votes: room.votes || {},
        votersReady: room.votersReady || 0,
        round: room.round || 1,
        speakOrder: room.speakOrder || [],
        lastTie: room.lastTie || null,
        chatMessages: room.chatMessages || [],
        alibiCase: room.alibiCase || null,
        alibiRoundResult: room.alibiRoundResult || null,
        alibiScoreboard: room.alibiScoreboard || [],
        partyLine: room.partyLine || null,
        partyLineRound: room.partyLineRound || null,
        partyLineResult: room.partyLineResult || null,
        partyLineScoreboard: room.partyLineScoreboard || [],
        partyLineCalls: room.partyLineCalls || [],
        myPartyLine: null,
        impostorChatMessages: room.impostorChatMessages || [],
        impostorLastGuessRound: Number.isFinite(room.impostorLastGuessRound) ? room.impostorLastGuessRound : -1,
        detectiveInterrogation: room.interrogation || null,
        detectiveInterrogationUsed: false,
        myImpostorTeammates: [],
        result: room.result || null,
        eliminationReveal: null,
        resumePending: false,
      })
      saveSession({ code, name: myName, avatar: myAvatar, profileId: you?.profileId || null, isGuest: you?.isGuest !== false || !you?.profileId, sessionToken: you?.sessionToken })
    })
    socket.on('room:resumed', ({ code, room, you }) => {
      set({
        roomCode: code,
        isHost: !!you?.isHost,
        players: room.players,
        config: room.config,
        phase: you?.clientPhase || room.phase || 'lobby',
        votes: room.votes || {},
        votersReady: room.votersReady || 0,
        round: room.round || 1,
        speakOrder: room.speakOrder || [],
        lastTie: room.lastTie || null,
        result: room.result || null,
        myId: you?.id || get().myId,
        myName: you?.name || get().myName,
        myAvatar: normalizeAvatar(you?.avatar || get().myAvatar, you?.name || get().myName),
        myProfileId: you?.profileId || null,
        isGuest: you?.isGuest !== false || !you?.profileId,
        chatMessages: room.chatMessages || [],
        alibiCase: room.alibiCase || null,
        alibiRoundResult: room.alibiRoundResult || null,
        alibiScoreboard: room.alibiScoreboard || [],
        partyLine: room.partyLine || null,
        partyLineRound: room.partyLineRound || null,
        partyLineResult: room.partyLineResult || null,
        partyLineScoreboard: room.partyLineScoreboard || [],
        partyLineCalls: room.partyLineCalls || [],
        impostorChatMessages: room.impostorChatMessages || [],
        impostorLastGuessRound: Number.isFinite(you?.impostorLastGuessRound)
          ? you.impostorLastGuessRound
          : Number.isFinite(room?.impostorLastGuessRound)
            ? room.impostorLastGuessRound
            : -1,
        detectiveInterrogation: room.interrogation || null,
        votedFor: you?.votedFor || null,
        lastGuessRound: Number.isFinite(you?.lastGuessRound) ? you.lastGuessRound : -1,
        eliminationReveal: null,
        resumePending: false,
      })
      scheduleInterrogationClear(room.interrogation, set)
      saveSession({
        code,
        name: you?.name || get().myName,
        avatar: normalizeAvatar(you?.avatar || get().myAvatar, you?.name || get().myName),
        profileId: you?.profileId || null,
        isGuest: you?.isGuest !== false || !you?.profileId,
        sessionToken: you?.sessionToken,
      })
      if (you?.role) {
        set({
          myRole: you.role,
          myWord: you.word ?? null,
          myClue: you.clue ?? null,
          myAlibi: you.alibi ?? null,
          myPartyLine: you.partyLine ?? null,
          myImpostorTeammates: Array.isArray(you.impostorTeammates) ? you.impostorTeammates : [],
          impostorChatMessages: Array.isArray(you.impostorChatMessages) ? you.impostorChatMessages : get().impostorChatMessages,
          impostorLastGuessRound: Number.isFinite(you.impostorLastGuessRound) ? you.impostorLastGuessRound : get().impostorLastGuessRound,
          detectiveInterrogationUsed: !!you.detectiveInterrogationUsed,
        })
      } else {
        set({
          myRole: null,
          myWord: null,
          myClue: null,
          myAlibi: null,
          myPartyLine: null,
          myImpostorTeammates: [],
          impostorChatMessages: [],
          impostorLastGuessRound: -1,
          detectiveInterrogationUsed: false,
        })
      }
      toast.success('Te reconectaste a la sala', { duration: 2500 })
    })
    socket.on('room:resumeFailed', ({ message } = {}) => {
      clearSession()
      clearInterrogationClearTimer()
      set({
        roomCode: null,
        isHost: false,
        myId: null,
        players: [],
        config: null,
        phase: 'lobby',
        myRole: null,
        myWord: null,
        myClue: null,
        myAlibi: null,
        alibiCase: null,
        alibiRoundResult: null,
        alibiScoreboard: [],
        myPartyLine: null,
        partyLine: null,
        partyLineRound: null,
        partyLineResult: null,
        partyLineScoreboard: [],
        partyLineCalls: [],
        myImpostorTeammates: [],
        votes: {},
        votedFor: null,
        chatMessages: [],
        impostorChatMessages: [],
        impostorLastGuessRound: -1,
        detectiveInterrogation: null,
        detectiveInterrogationUsed: false,
        eliminationReveal: null,
        resumePending: false,
      })
      if (message) toast.warn(message, { duration: 3500 })
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
        votes: room?.votes || get().votes,
        votersReady: room?.votersReady ?? get().votersReady,
        round: room?.round || get().round,
        speakOrder: room?.speakOrder || get().speakOrder,
        lastTie: room?.lastTie || get().lastTie,
        result: room?.result || get().result,
        alibiCase: room?.alibiCase || get().alibiCase,
        alibiRoundResult: room?.alibiRoundResult || get().alibiRoundResult,
        alibiScoreboard: room?.alibiScoreboard || get().alibiScoreboard,
        partyLine: room?.partyLine || get().partyLine,
        partyLineRound: room?.partyLineRound || get().partyLineRound,
        partyLineResult: room?.partyLineResult || get().partyLineResult,
        partyLineScoreboard: room?.partyLineScoreboard || get().partyLineScoreboard,
        partyLineCalls: room?.partyLineCalls || get().partyLineCalls,
        detectiveInterrogation: room?.interrogation || get().detectiveInterrogation,
      })
      toast.success('Ahora eres el anfitrion', { duration: 3000 })
    })
    socket.on('room:config', ({ config }) => set({ config }))
    socket.on('room:error', ({ message }) => {
      set({ error: message })
      toast.error(message || 'Error en la sala', { title: 'Sala' })
    })

    socket.on('game:started', ({ phase = 'reveal', alibiCase = null, partyLine = null } = {}) => {
      sfx.startGame()
      clearInterrogationClearTimer()
      set({
        phase,
        myRole: null,
        myWord: null,
        myClue: null,
        myAlibi: null,
        alibiCase: alibiCase || null,
        alibiRoundResult: null,
        myPartyLine: null,
        partyLine: partyLine || null,
        partyLineRound: null,
        partyLineResult: null,
        partyLineScoreboard: partyLine?.scoreboard || [],
        partyLineCalls: [],
        myImpostorTeammates: [],
        votes: {},
        votedFor: null,
        guessAttempts: 0,
        round: 1,
        lastGuessRound: -1,
        impostorLastGuessRound: -1,
        speakOrder: [],
        lastTie: null,
        chatMessages: [],
        impostorChatMessages: [],
        detectiveInterrogation: null,
        detectiveInterrogationUsed: false,
        eliminationReveal: null,
      })
    })
    socket.on('game:yourRole', ({ role, word, clue, alibi, partyLine, impostorTeammates, impostorChatMessages, impostorLastGuessRound, detectiveInterrogationUsed }) => {
      set({
        myRole: role,
        myWord: word,
        myClue: clue,
        myAlibi: alibi ?? null,
        myPartyLine: partyLine ?? null,
        myImpostorTeammates: Array.isArray(impostorTeammates) ? impostorTeammates : [],
        impostorChatMessages: Array.isArray(impostorChatMessages) ? impostorChatMessages : [],
        impostorLastGuessRound: Number.isFinite(impostorLastGuessRound) ? impostorLastGuessRound : -1,
        detectiveInterrogationUsed: !!detectiveInterrogationUsed,
      })
    })
    socket.on('game:phase', ({ phase, speakOrder }) => {
      const effectivePhase = phaseForCurrentPlayer(get(), phase)
      const update = {
        phase: effectivePhase,
        ...(speakOrder ? { speakOrder } : {}),
        ...(effectivePhase !== 'discussion' ? { detectiveInterrogation: null } : {}),
      }
      if (effectivePhase === 'voting') update.votersReady = 0
      if (phase === 'caseIntro') {
        update.myRole = null
        update.myWord = null
        update.myClue = null
        update.myAlibi = null
      }
      if (phase === 'partyIntro') {
        update.myRole = null
        update.myWord = null
        update.myClue = null
        update.myAlibi = null
        update.myPartyLine = null
        update.partyLineRound = null
        update.partyLineResult = null
        update.partyLineCalls = []
      }
      if (phase === 'partyRound') {
        update.partyLineResult = null
        update.partyLineCalls = []
      }
      if (phase === 'reveal') {
        update.votedFor = null
        update.votes = {}
        update.votersReady = 0
        update.alibiRoundResult = null
      }
      if (effectivePhase !== 'discussion') clearInterrogationClearTimer()
      set(update)
      if (effectivePhase === 'voting') sfx.startVoting()
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
    socket.on('impostor:message', ({ message }) => {
      if (!message?.id) return
      set((s) => ({ impostorChatMessages: [...s.impostorChatMessages, message].slice(-CHAT_MESSAGE_LIMIT) }))
      if (message.playerId !== get().myId) sfx.chatMessage()
    })
    socket.on('impostor:error', ({ message }) => {
      toast.warn(message || 'No se pudo enviar el mensaje privado', { duration: 2500 })
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
    socket.on('game:guessFailed', ({ playerId, socketId, lastGuessRound }) => {
      const { myId } = get()
      sfx.guessWrong()
      const nextLastGuessRound = Number.isFinite(lastGuessRound) ? lastGuessRound : get().round
      set({ impostorLastGuessRound: nextLastGuessRound })
      if ((playerId || socketId) === myId) {
        set((s) => ({ guessAttempts: s.guessAttempts + 1, lastGuessRound: nextLastGuessRound }))
        toast.error('Palabra incorrecta', { duration: 3000 })
      } else {
        toast.info('Un impostor intentó adivinar... y falló', { duration: 3000 })
      }
    })
    socket.on('game:guessBlocked', ({ availableAt, lastGuessRound }) => {
      if (Number.isFinite(lastGuessRound)) set({ impostorLastGuessRound: lastGuessRound })
      toast.warn(`El equipo podra adivinar en la ronda ${availableAt}`, { duration: 3500 })
    })
    socket.on('game:over', (result) => {
      clearInterrogationClearTimer()
      set({
        phase: 'ended',
        result,
        detectiveInterrogation: null,
        alibiRoundResult: result?.roundResult || get().alibiRoundResult,
        alibiScoreboard: result?.alibiScoreboard || get().alibiScoreboard,
        partyLineResult: result?.roundResult || get().partyLineResult,
        partyLineScoreboard: result?.partyLineScoreboard || get().partyLineScoreboard,
        partyLineCalls: [],
      })
      if (result?.winner === 'impostor' && result?.reason === 'wordGuessed') sfx.guessCorrect()
    })
    socket.on('game:alibiRoundResult', ({ roundResult }) => {
      set({
        alibiRoundResult: roundResult || null,
        alibiScoreboard: roundResult?.scoreboard || get().alibiScoreboard,
      })
    })
    socket.on('game:alibiNextRound', ({ round, alibiCase }) => {
      set({
        phase: 'caseIntro',
        round: round || get().round + 1,
        alibiCase: alibiCase || null,
        alibiRoundResult: null,
        myRole: null,
        myWord: null,
        myClue: null,
        myAlibi: null,
        votes: {},
        votedFor: null,
        votersReady: 0,
        chatMessages: [],
      })
    })
    socket.on('game:partyLineRound', ({ round, partyLine, partyLineRound, privateRound, scoreboard }) => {
      set({
        phase: 'partyRound',
        round: round || get().round,
        partyLine: partyLine || get().partyLine,
        partyLineRound: partyLineRound || null,
        myPartyLine: privateRound || null,
        partyLineResult: null,
        partyLineScoreboard: scoreboard || partyLine?.scoreboard || get().partyLineScoreboard,
        partyLineCalls: [],
        chatMessages: [],
      })
    })
    socket.on('game:partyLineSubmissionUpdate', ({ submittedPlayerIds, submittedCount, totalPlayers }) => {
      set((s) => ({
        partyLineRound: s.partyLineRound ? {
          ...s.partyLineRound,
          submittedPlayerIds: submittedPlayerIds || s.partyLineRound.submittedPlayerIds || [],
          submittedCount: Number.isFinite(submittedCount) ? submittedCount : s.partyLineRound.submittedCount,
          totalPlayers: Number.isFinite(totalPlayers) ? totalPlayers : s.partyLineRound.totalPlayers,
        } : s.partyLineRound,
      }))
    })
    socket.on('game:partyLineResult', ({ roundResult }) => {
      set({
        partyLineResult: roundResult || null,
        partyLineScoreboard: roundResult?.scoreboard || get().partyLineScoreboard,
        partyLineCalls: [],
      })
    })
    socket.on('partyline:calls', ({ calls } = {}) => {
      set({ partyLineCalls: Array.isArray(calls) ? calls : [] })
    })
    socket.on('partyline:error', ({ message } = {}) => {
      toast.warn(message || 'No se pudo completar la llamada', { duration: 2500 })
    })
    socket.on('game:newRound', ({ round, speakOrder }) => set({ votes: {}, votedFor: null, phase: 'discussion', round, ...(speakOrder ? { speakOrder } : {}) }))
    socket.on('room:rematch', ({ room }) => {
      set({
        phase: 'lobby',
        players: room.players,
        config: room.config,
        isHost: isCurrentHost(room.players, get().myId, get().isHost),
        myRole: null, myWord: null, myClue: null, myAlibi: null, myImpostorTeammates: [],
        votes: {}, votedFor: null, votersReady: 0,
        result: null, guessAttempts: 0, round: 1, lastGuessRound: -1, impostorLastGuessRound: -1, speakOrder: [], lastTie: null,
        chatMessages: room.chatMessages || [],
        alibiCase: room.alibiCase || null,
        alibiRoundResult: null,
        alibiScoreboard: [],
        myPartyLine: null,
        partyLine: room.partyLine || null,
        partyLineRound: null,
        partyLineResult: null,
        partyLineScoreboard: [],
        partyLineCalls: [],
        impostorChatMessages: room.impostorChatMessages || [],
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
      resumePending: false,
      roomCode: null,
      isHost: false,
      players: [],
      phase: 'lobby',
      myRole: null,
      myWord: null,
      myClue: null,
      myAlibi: null,
      alibiCase: null,
      alibiRoundResult: null,
      alibiScoreboard: [],
      myPartyLine: null,
      partyLine: null,
      partyLineRound: null,
      partyLineResult: null,
      partyLineScoreboard: [],
      partyLineCalls: [],
      myImpostorTeammates: [],
      impostorChatMessages: [],
      impostorLastGuessRound: -1,
      myAvatar: null,
      myProfileId: null,
      isGuest: true,
      chatMessages: [],
      detectiveInterrogation: null,
      detectiveInterrogationUsed: false,
      eliminationReveal: null,
    })
  },

  createRoom: (hostName, config, avatar, profile = {}) => {
    const myAvatar = normalizeAvatar(avatar, hostName)
    const profileId = profile?.isGuest === false ? profile.profileId || null : null
    const isGuest = !profileId
    rememberAvatarForName(hostName, myAvatar)
    set({ myName: hostName, myAvatar, myProfileId: profileId, isGuest, error: null })
    get().socket?.emit('room:create', { hostName, avatar: myAvatar, config, profileId, isGuest })
  },

  joinRoom: (code, playerName, avatar, profile = {}) => {
    const myAvatar = normalizeAvatar(avatar, playerName)
    const profileId = profile?.isGuest === false ? profile.profileId || null : null
    const isGuest = !profileId
    rememberAvatarForName(playerName, myAvatar)
    set({ myName: playerName, myAvatar, myProfileId: profileId, isGuest, error: null })
    get().socket?.emit('room:join', { code: code.toUpperCase(), playerName, avatar: myAvatar, profileId, isGuest })
  },

  leaveRoom: () => {
    get().socket?.emit('room:leave')
    clearSession()
    clearInterrogationClearTimer()
    set({
      roomCode: null,
      resumePending: false,
      isHost: false,
      players: [],
      phase: 'lobby',
      myRole: null,
      myWord: null,
      myClue: null,
      myAlibi: null,
      alibiCase: null,
      alibiRoundResult: null,
      alibiScoreboard: [],
      myPartyLine: null,
      partyLine: null,
      partyLineRound: null,
      partyLineResult: null,
      partyLineScoreboard: [],
      partyLineCalls: [],
      myImpostorTeammates: [],
      myProfileId: null,
      isGuest: true,
      votes: {},
      votedFor: null,
      chatMessages: [],
      impostorChatMessages: [],
      impostorLastGuessRound: -1,
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

  continueAlibiIntro: () => {
    get().socket?.emit('game:continueAlibiIntro')
  },

  continuePartyLineIntro: () => {
    get().socket?.emit('game:continuePartyLineIntro')
  },

  goToVote: () => {
    if (isCurrentPlayerOut(get())) return
    get().socket?.emit('game:goToVote')
  },

  castVote: (targetId) => {
    const state = get()
    if (isCurrentPlayerOut(state) || state.phase !== 'voting' || state.votedFor) return
    const target = state.players.find(player => (
      player.id === targetId &&
      !player.eliminated &&
      !player.disconnected &&
      player.id !== state.myId
    ))
    if (!target) return
    get().socket?.emit('vote:cast', { targetId })
    sfx.voteCast()
    set((s) => ({ votedFor: targetId, phase: 'voted', votersReady: s.votersReady + 1 }))
  },

  guessWord: (word) => {
    if (isCurrentPlayerOut(get())) return
    get().socket?.emit('game:guessWord', { word })
  },

  sendChatMessage: (text) => {
    get().socket?.emit('chat:message', { text })
  },

  sendImpostorChatMessage: (text) => {
    get().socket?.emit('impostor:message', { text })
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

  nextAlibiRound: () => {
    get().socket?.emit('game:nextAlibiRound')
  },

  submitPartyLineAction: (action) => {
    get().socket?.emit('game:partyLineSubmit', { action })
    set((s) => ({
      myPartyLine: s.myPartyLine ? { ...s.myPartyLine, submitted: true } : s.myPartyLine,
    }))
  },

  nextPartyLineRound: () => {
    get().socket?.emit('game:nextPartyLineRound')
  },

  requestPartyLineCall: (targetId) => {
    get().socket?.emit('partyline:callRequest', { targetId })
  },

  acceptPartyLineCall: (callId) => {
    get().socket?.emit('partyline:callAccept', { callId })
  },

  declinePartyLineCall: (callId) => {
    get().socket?.emit('partyline:callDecline', { callId })
  },

  cancelPartyLineCall: (callId) => {
    get().socket?.emit('partyline:callCancel', { callId })
  },

  hangupPartyLineCall: (callId) => {
    get().socket?.emit('partyline:callHangup', { callId })
  },

  setConfig: (patch) => {
    const cfg = { ...(get().config || {}), ...patch }
    set({ config: cfg })
    get().socket?.emit('room:updateConfig', { config: cfg })
  },

  clearError: () => set({ error: null }),
}))
