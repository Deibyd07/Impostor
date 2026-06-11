import { normalizeAvatar } from './avatars.js'

export const PARTYLINE_ROUND_OPTIONS = [3, 5, 7, 10]
export const PARTYLINE_GAME_IDS = ['neighbors', 'message', 'dilemma', 'identity']

export const partyLineGames = {
  neighbors: {
    id: 'neighbors',
    title: 'Habitaciones vecinas',
    shortTitle: 'Vecinos',
    tone: 'blue',
    objective: 'Deduce quienes estan a tu izquierda y derecha en un pasillo telefonico oculto.',
    actionLabel: 'Enviar vecinos',
  },
  message: {
    id: 'message',
    title: 'Mensaje interceptado',
    shortTitle: 'Mensaje',
    tone: 'gold',
    objective: 'Reconstruyan una frase incompleta y detecten que fragmentos fueron plantados.',
    actionLabel: 'Enviar frase',
  },
  dilemma: {
    id: 'dilemma',
    title: 'Dilema del complice',
    shortTitle: 'Dilema',
    tone: 'red',
    objective: 'Negocia con tu complice secreto y decide si cooperas o traicionas.',
    actionLabel: 'Confirmar decision',
  },
  identity: {
    id: 'identity',
    title: 'Codigo de oficio',
    shortTitle: 'Codigo',
    tone: 'violet',
    objective: 'Comparen protocolos privados y detecten quien recibio un procedimiento falso.',
    actionLabel: 'Acusar protocolo',
  },
}

const ROOM_START = 201

function roomNumberForIndex(index) {
  return String(ROOM_START + index)
}

const MESSAGE_CASES = [
  {
    title: 'Clave del ascensor',
    fragments: [
      'La llave negra',
      'abre el ascensor',
      'despues de medianoche',
      'cuando el guardia se va',
      'por el pasillo lateral',
      'sin encender las luces',
      'dejando el sobre azul',
      'debajo del telefono roto',
      'antes de la ultima llamada',
      'mientras la camara oeste falla',
      'para que nadie revise la azotea',
      'hasta que suene la alarma corta',
    ],
    decoys: [
      'La llave roja abre la azotea',
      'El ascensor nunca funciona',
      'Medianoche es una distraccion',
      'El guardia se queda en recepcion',
      'El sobre azul debe ir en la caja fuerte',
      'La camara oeste siempre esta encendida',
      'La alarma corta significa cancelar todo',
      'El pasillo lateral esta bloqueado',
    ],
  },
  {
    title: 'Entrega en recepcion',
    fragments: [
      'El recepcionista deja',
      'la tarjeta plateada',
      'dentro del libro de visitas',
      'cuando termina el turno',
      'junto a la campana apagada',
      'para abrir la oficina trasera',
      'sin despertar al supervisor',
      'ni tocar la caja fuerte',
      'antes de que suba el ascensor',
      'con el sello mirando hacia abajo',
      'y la luz del lobby en rojo',
      'hasta que alguien pida cafe',
    ],
    decoys: [
      'La tarjeta plateada va en el ascensor',
      'El libro de visitas esta vacio',
      'La campana apagada es una trampa',
      'La oficina trasera no tiene cerradura',
      'El supervisor nunca duerme',
      'La caja fuerte debe abrirse primero',
      'La luz roja significa evacuacion',
      'El cafe cancela la entrega',
    ],
  },
  {
    title: 'Codigo de la cabina',
    fragments: [
      'Tres golpes cortos',
      'significan que',
      'la salida esta libre',
      'por la cabina de radio',
      'despues del segundo anuncio',
      'cuando el operador cuelga',
      'con la puerta norte abierta',
      'y el cable rojo desconectado',
      'antes de que vuelva la senal',
      'sin cruzar la sala de espera',
      'dejando la ficha en el mostrador',
      'para guiar al ultimo pasajero',
    ],
    decoys: [
      'Dos golpes largos cierran la salida',
      'La cabina de radio esta vigilada',
      'El primer anuncio es la clave',
      'El operador nunca cuelga',
      'La puerta norte debe quedar cerrada',
      'El cable rojo activa la alarma',
      'La sala de espera es obligatoria',
      'La ficha va dentro de la maleta',
    ],
  },
  {
    title: 'Archivo del museo',
    fragments: [
      'El guante blanco',
      'levanta el cristal norte',
      'cuando el reloj marca las once',
      'en la sala de retratos',
      'mientras la guia apaga el audio',
      'dejando el catalogo abierto',
      'sobre la vitrina central',
      'con la moneda falsa debajo',
      'antes de cerrar la exposicion',
      'sin tocar la estatua dorada',
      'para mover el mapa antiguo',
      'hacia la puerta de restauracion',
    ],
    decoys: [
      'El guante negro abre la bodega',
      'El cristal norte no se mueve',
      'El reloj de las once esta roto',
      'La guia mantiene el audio prendido',
      'El catalogo debe quedar cerrado',
      'La moneda falsa esta en recepcion',
      'La estatua dorada es la pieza principal',
      'La puerta de restauracion esta sellada',
    ],
  },
  {
    title: 'Mesa del casino',
    fragments: [
      'La ficha verde',
      'cambia de mano',
      'en la mesa numero siete',
      'cuando el crupier mira al balcon',
      'despues de la tercera apuesta',
      'junto al vaso sin hielo',
      'con el naipe marcado debajo',
      'antes de que cierre la caja',
      'sin tocar la ruleta central',
      'mientras seguridad revisa la barra',
      'para activar la salida privada',
      'por la cortina roja',
    ],
    decoys: [
      'La ficha roja pertenece a la caja',
      'La mesa siete esta cerrada',
      'El crupier nunca mira al balcon',
      'La primera apuesta decide todo',
      'El vaso con hielo confirma la entrega',
      'El naipe marcado esta sobre la mesa',
      'La ruleta central debe girar',
      'La salida privada queda por cocina',
    ],
  },
  {
    title: 'Operacion del puerto',
    fragments: [
      'La caja gris',
      'sale del muelle tres',
      'cuando baja la niebla',
      'con la marca del faro',
      'junto al contenedor vacio',
      'despues de apagar la grua',
      'sin pasar por aduana',
      'antes del cambio de guardia',
      'mientras el barco azul espera',
      'dejando la cuerda cortada',
      'para abrir la compuerta sur',
      'al sonar dos campanas',
    ],
    decoys: [
      'La caja amarilla entra por aduana',
      'El muelle tres esta inundado',
      'La niebla obliga a cancelar',
      'La marca del faro es falsa',
      'La grua debe quedar encendida',
      'El barco azul ya zarpo',
      'La cuerda cortada va en la oficina',
      'Tres campanas abren la compuerta',
    ],
  },
  {
    title: 'Boveda del banco',
    fragments: [
      'El codigo plateado',
      'abre la boveda secundaria',
      'cuando el contador reinicia',
      'despues del deposito falso',
      'con la firma en tinta azul',
      'bajo la carpeta de prestamos',
      'antes de cerrar ventanilla',
      'sin llamar al gerente',
      'mientras la alarma queda muda',
      'dejando la tarjeta en el cajon',
      'para mover el maletin negro',
      'hacia la puerta de servicio',
    ],
    decoys: [
      'El codigo dorado abre la boveda principal',
      'El contador nunca reinicia',
      'El deposito falso va al final',
      'La firma debe ser roja',
      'La carpeta de prestamos no importa',
      'El gerente tiene que autorizar',
      'La alarma muda significa peligro',
      'El maletin negro se queda en caja',
    ],
  },
  {
    title: 'Ensayo del teatro',
    fragments: [
      'El libreto marcado',
      'queda bajo la butaca doce',
      'cuando cae el telon',
      'despues del ensayo general',
      'con la mascara mirando al publico',
      'mientras el tecnico corta la luz',
      'antes del aplauso grabado',
      'sin abrir el camerino rojo',
      'dejando una flor en el escenario',
      'para distraer al director',
      'y mover la llave del palco',
      'hacia la salida trasera',
    ],
    decoys: [
      'El libreto limpio va al camerino',
      'La butaca doce esta reservada',
      'El telon no cae esta noche',
      'El ensayo general fue cancelado',
      'La mascara mira al escenario',
      'El tecnico enciende la luz',
      'El camerino rojo debe abrirse',
      'La llave del palco esta en taquilla',
    ],
  },
  {
    title: 'Cocina cerrada',
    fragments: [
      'La servilleta negra',
      'esconde la clave',
      'junto al horno apagado',
      'cuando el chef sale',
      'despues de cerrar la terraza',
      'con el cuchillo limpio encima',
      'antes de lavar las copas',
      'sin entrar a la despensa',
      'mientras la reserva falsa espera',
      'dejando el plato frio',
      'para abrir la puerta del patio',
      'al pedir la cuenta',
    ],
    decoys: [
      'La servilleta blanca tiene la clave',
      'El horno debe estar prendido',
      'El chef no abandona la cocina',
      'La terraza se cierra al final',
      'El cuchillo limpio es una senal falsa',
      'La despensa guarda el plato frio',
      'La reserva falsa ya fue borrada',
      'La cuenta se pide despues de abrir',
    ],
  },
  {
    title: 'Pabellon nocturno',
    fragments: [
      'La pulsera violeta',
      'permite cruzar enfermeria',
      'cuando termina la ronda',
      'por el pasillo de rayos',
      'despues de apagar el monitor',
      'con la carpeta del paciente',
      'bajo la silla metalica',
      'antes de abrir farmacia',
      'sin tocar la camilla vacia',
      'mientras recepcion cambia turno',
      'para sacar la muestra fria',
      'por la puerta de emergencia',
    ],
    decoys: [
      'La pulsera verde bloquea enfermeria',
      'La ronda empieza por rayos',
      'El monitor debe quedar encendido',
      'La carpeta del paciente esta en farmacia',
      'La silla metalica no existe',
      'La camilla vacia guarda la muestra',
      'Recepcion no cambia turno',
      'La puerta de emergencia esta sellada',
    ],
  },
]

const IDENTITY_CASES = [
  {
    title: 'Hotel Continental',
    role: 'Personal de recepcion',
    prompt: 'Todos trabajan el turno nocturno del hotel. Comparen el protocolo para un huesped sin reserva y detecten el paso alterado.',
    realProtocol: [
      'Pedir documento en recepcion',
      'abrir registro temporal en el libro azul',
      'entregar llave dorada',
      'avisar al turno nocturno',
    ],
    fakeProtocol: [
      'Pedir documento en recepcion',
      'abrir registro temporal en el libro azul',
      'entregar llave plateada',
      'avisar al turno nocturno',
    ],
    detailOptions: [
      { id: 'route', label: 'Ruta de entrada equivocada' },
      { id: 'record', label: 'Registro en documento incorrecto' },
      { id: 'key', label: 'Llave con color incorrecto' },
      { id: 'notice', label: 'Aviso a la persona incorrecta' },
    ],
    falseDetailId: 'key',
    safeWords: ['recepcion', 'libro azul', 'llave dorada', 'turno nocturno'],
    trapWords: ['recepcion', 'libro azul', 'llave plateada', 'turno nocturno'],
  },
  {
    title: 'Estacion nocturna',
    role: 'Operador de estacion',
    prompt: 'La estacion cerro por tormenta. Todos deben explicar como se maneja una maleta abandonada sin revelar su carta completa.',
    realProtocol: [
      'Marcar la maleta con cinta amarilla',
      'moverla a taquilla',
      'llamar por radio al anden central',
      'esperar al jefe de turno',
    ],
    fakeProtocol: [
      'Marcar la maleta con cinta amarilla',
      'moverla a cafeteria',
      'llamar por radio al anden central',
      'esperar al jefe de turno',
    ],
    detailOptions: [
      { id: 'mark', label: 'Marca de seguridad equivocada' },
      { id: 'place', label: 'Zona de resguardo equivocada' },
      { id: 'call', label: 'Canal de aviso equivocado' },
      { id: 'authority', label: 'Autoridad final equivocada' },
    ],
    falseDetailId: 'place',
    safeWords: ['cinta amarilla', 'taquilla', 'radio', 'jefe de turno'],
    trapWords: ['cinta amarilla', 'cafeteria', 'radio', 'jefe de turno'],
  },
  {
    title: 'Casino cerrado',
    role: 'Supervisor de mesa',
    prompt: 'El casino encontro fichas fuera de caja. Comparen el cierre de mesa y descubran quien tiene un protocolo fabricado.',
    realProtocol: [
      'Contar fichas frente al crupier',
      'sellar bolsa negra',
      'firmar hoja de caja',
      'guardar naipes en bodega',
    ],
    fakeProtocol: [
      'Contar fichas frente al crupier',
      'sellar bolsa negra',
      'firmar hoja de apuestas',
      'guardar naipes en bodega',
    ],
    detailOptions: [
      { id: 'witness', label: 'Testigo de conteo incorrecto' },
      { id: 'seal', label: 'Bolsa de cierre incorrecta' },
      { id: 'paper', label: 'Documento firmado incorrecto' },
      { id: 'cards', label: 'Destino de naipes incorrecto' },
    ],
    falseDetailId: 'paper',
    safeWords: ['crupier', 'bolsa negra', 'hoja de caja', 'bodega'],
    trapWords: ['crupier', 'bolsa negra', 'hoja de apuestas', 'bodega'],
  },
  {
    title: 'Museo Bellver',
    role: 'Custodio de galeria',
    prompt: 'Un cristal se activo durante la exposicion. Cada custodio conoce el protocolo de emergencia, pero alguien trae una version falsa.',
    realProtocol: [
      'Cerrar la sala de retratos',
      'cubrir la vitrina norte',
      'llamar a restauracion',
      'registrar hora en el cuaderno gris',
    ],
    fakeProtocol: [
      'Cerrar la sala de retratos',
      'cubrir la vitrina norte',
      'llamar a boleteria',
      'registrar hora en el cuaderno gris',
    ],
    detailOptions: [
      { id: 'room', label: 'Sala cerrada incorrecta' },
      { id: 'display', label: 'Accion sobre vitrina incorrecta' },
      { id: 'team', label: 'Equipo avisado incorrecto' },
      { id: 'log', label: 'Registro usado incorrecto' },
    ],
    falseDetailId: 'team',
    safeWords: ['sala de retratos', 'cubrir vitrina', 'restauracion', 'cuaderno gris'],
    trapWords: ['sala de retratos', 'cubrir vitrina', 'boleteria', 'cuaderno gris'],
  },
  {
    title: 'Banco Meridian',
    role: 'Auxiliar de boveda',
    prompt: 'La boveda secundaria quedo abierta. Todos dicen conocer el cierre seguro, pero una version no cuadra.',
    realProtocol: [
      'Validar firma con tinta azul',
      'cerrar caja secundaria',
      'activar contador manual',
      'entregar llave al gerente',
    ],
    fakeProtocol: [
      'Validar firma con tinta azul',
      'cerrar caja secundaria',
      'apagar contador manual',
      'entregar llave al gerente',
    ],
    detailOptions: [
      { id: 'ink', label: 'Tinta de validacion incorrecta' },
      { id: 'box', label: 'Caja cerrada incorrecta' },
      { id: 'counter', label: 'Accion del contador incorrecta' },
      { id: 'key', label: 'Custodio de llave incorrecto' },
    ],
    falseDetailId: 'counter',
    safeWords: ['tinta azul', 'caja secundaria', 'contador manual', 'gerente'],
    trapWords: ['tinta azul', 'caja secundaria', 'apagar contador', 'gerente'],
  },
  {
    title: 'Hospital Santa Bruma',
    role: 'Enfermeria nocturna',
    prompt: 'Un paciente fue movido sin permiso. Comparen el traslado correcto y detecten quien no pertenece al turno.',
    realProtocol: [
      'Revisar pulsera verde',
      'avisar a enfermeria central',
      'mover por pasillo limpio',
      'firmar en carpeta clinica',
    ],
    fakeProtocol: [
      'Revisar pulsera verde',
      'avisar a enfermeria central',
      'mover por ascensor de visitas',
      'firmar en carpeta clinica',
    ],
    detailOptions: [
      { id: 'band', label: 'Pulsera de paciente incorrecta' },
      { id: 'notice', label: 'Area avisada incorrecta' },
      { id: 'path', label: 'Ruta de traslado incorrecta' },
      { id: 'file', label: 'Documento firmado incorrecto' },
    ],
    falseDetailId: 'path',
    safeWords: ['pulsera verde', 'enfermeria central', 'pasillo limpio', 'carpeta clinica'],
    trapWords: ['pulsera verde', 'enfermeria central', 'ascensor', 'carpeta clinica'],
  },
  {
    title: 'Teatro Argenta',
    role: 'Tecnico de escenario',
    prompt: 'Antes de abrir el telon hubo un apagado breve. Todos conocen el protocolo de escena, excepto quien recibio una orden falsa.',
    realProtocol: [
      'Bajar luz lateral',
      'bloquear camerino tres',
      'pedir silencio por intercom',
      'revisar cuerda del telon',
    ],
    fakeProtocol: [
      'Bajar luz lateral',
      'bloquear camerino tres',
      'pedir silencio al publico',
      'revisar cuerda del telon',
    ],
    detailOptions: [
      { id: 'light', label: 'Luz manipulada incorrecta' },
      { id: 'room', label: 'Camerino bloqueado incorrecto' },
      { id: 'notice', label: 'Canal de aviso incorrecto' },
      { id: 'check', label: 'Elemento revisado incorrecto' },
    ],
    falseDetailId: 'notice',
    safeWords: ['luz lateral', 'camerino tres', 'intercom', 'cuerda del telon'],
    trapWords: ['luz lateral', 'camerino tres', 'publico', 'cuerda del telon'],
  },
  {
    title: 'Puerto Norte',
    role: 'Inspector de muelle',
    prompt: 'Un contenedor salio de ruta. Cada inspector tiene un protocolo de liberacion, pero uno trae pasos que no pertenecen al puerto.',
    realProtocol: [
      'Verificar sello rojo',
      'cruzar lista de aduana',
      'marcar grua dos',
      'autorizar salida por compuerta sur',
    ],
    fakeProtocol: [
      'Verificar sello azul',
      'cruzar lista de aduana',
      'marcar grua dos',
      'autorizar salida por compuerta sur',
    ],
    detailOptions: [
      { id: 'seal', label: 'Sello verificado incorrecto' },
      { id: 'list', label: 'Lista comparada incorrecta' },
      { id: 'crane', label: 'Grua marcada incorrecta' },
      { id: 'gate', label: 'Compuerta de salida incorrecta' },
    ],
    falseDetailId: 'seal',
    safeWords: ['sello rojo', 'aduana', 'grua dos', 'compuerta sur'],
    trapWords: ['sello azul', 'aduana', 'grua dos', 'compuerta sur'],
  },
]

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function normalizeMessageText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function sanitizePhraseGuess(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240)
}

function messageGuessMatches(guess, fragments = []) {
  const normalizedGuess = normalizeMessageText(guess)
  if (!normalizedGuess) return false

  const normalizedMessage = normalizeMessageText(fragments.join(' '))
  if (normalizedGuess === normalizedMessage) return true

  let cursor = 0
  return fragments.every(fragment => {
    const target = normalizeMessageText(fragment)
    if (!target) return true
    const index = normalizedGuess.indexOf(target, cursor)
    if (index === -1) return false
    cursor = index + target.length
    return true
  })
}

function messageSpeedPoints(rank) {
  if (rank === 1) return 5
  if (rank === 2) return 4
  if (rank === 3) return 3
  return 2
}

function clampInt(value, min, max, fallback) {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function playerSummary(player) {
  return {
    id: player.id,
    name: player.name,
    avatar: normalizeAvatar(player.avatar, player.name),
  }
}

export function sanitizePartyLineConfig(config = {}, playerCount = 3) {
  const enabled = Array.isArray(config.partyLineGames)
    ? config.partyLineGames.filter(id => PARTYLINE_GAME_IDS.includes(id))
    : PARTYLINE_GAME_IDS
  const partyLineGamesEnabled = enabled.length ? [...new Set(enabled)] : PARTYLINE_GAME_IDS
  const settings = config.partyLineSettings && typeof config.partyLineSettings === 'object'
    ? config.partyLineSettings
    : {}

  return {
    partyLineRounds: PARTYLINE_ROUND_OPTIONS.includes(Number(config.partyLineRounds))
      ? Number(config.partyLineRounds)
      : 5,
    partyLineGames: partyLineGamesEnabled,
    partyLineSettings: {
      neighbors: {
        strictOrder: settings.neighbors?.strictOrder !== false,
      },
      message: {
        decoyCount: clampInt(settings.message?.decoyCount, 1, Math.max(1, Math.min(2, playerCount - 2)), 1),
      },
      dilemma: {
        highStakes: !!settings.dilemma?.highStakes,
      },
      identity: {
        outsiderCount: clampInt(settings.identity?.outsiderCount, 1, Math.max(1, Math.min(2, playerCount - 1)), 1),
      },
    },
  }
}

export function emptyPartyLineScore(player) {
  return {
    playerId: player.id,
    name: player.name,
    avatar: normalizeAvatar(player.avatar, player.name),
    profileId: player.profileId || null,
    isGuest: player.isGuest !== false || !player.profileId,
    totalPoints: 0,
    roundsWon: 0,
    lastDelta: 0,
  }
}

export function partyLineScoreboard(room) {
  return Object.values(room.partyLine?.scores || {})
    .sort((a, b) => (
      b.totalPoints - a.totalPoints ||
      b.roundsWon - a.roundsWon ||
      a.name.localeCompare(b.name)
    ))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export function createPartyLineState(room) {
  const config = sanitizePartyLineConfig(room.config || {}, room.players.length)
  const scores = {}
  room.players.forEach(player => {
    scores[player.id] = emptyPartyLineScore(player)
  })

  return {
    totalRounds: config.partyLineRounds,
    enabledGames: config.partyLineGames,
    settings: config.partyLineSettings,
    scores,
    history: [],
    currentRound: null,
    roundResult: null,
    lastGameId: null,
  }
}

export function publicPartyLineSummary(room) {
  if (!room?.partyLine) return null
  return {
    totalRounds: room.partyLine.totalRounds || 5,
    enabledGames: room.partyLine.enabledGames || PARTYLINE_GAME_IDS,
    settings: room.partyLine.settings || {},
    games: (room.partyLine.enabledGames || PARTYLINE_GAME_IDS).map(id => partyLineGames[id]).filter(Boolean),
    scoreboard: partyLineScoreboard(room),
  }
}

export function createPartyLineRound(room) {
  const activePlayers = room.players.filter(player => !player.disconnected)
  if (activePlayers.length < 3) return null

  if (!room.partyLine) room.partyLine = createPartyLineState(room)
  const enabled = (room.partyLine.enabledGames || PARTYLINE_GAME_IDS).filter(id => partyLineGames[id])
  const gameId = pickOne(enabled)
  const base = {
    id: `${room.gameId || room.code}-${room.round}-${Date.now()}`,
    round: room.round,
    gameId,
    game: partyLineGames[gameId],
    players: activePlayers.map(playerSummary),
    assignments: {},
    submissions: {},
    createdAt: Date.now(),
  }

  const round = buildRoundByGame(room, base, activePlayers)
  room.partyLine.currentRound = round
  room.partyLine.roundResult = null
  room.partyLine.lastGameId = gameId
  return round
}

function buildRoundByGame(room, base, players) {
  if (base.gameId === 'neighbors') return buildNeighborsRound(room, base, players)
  if (base.gameId === 'message') return buildMessageRound(room, base, players)
  if (base.gameId === 'dilemma') return buildDilemmaRound(room, base, players)
  return buildIdentityRound(room, base, players)
}

function buildNeighborsRound(room, base, players) {
  const order = shuffle(players).map((player, index) => ({
    player,
    roomNumber: roomNumberForIndex(index),
  }))
  const strictOrder = room.partyLine?.settings?.neighbors?.strictOrder !== false
  order.forEach((entry, index) => {
    const left = order[(index - 1 + order.length) % order.length]
    const right = order[(index + 1) % order.length]
    base.assignments[entry.player.id] = {
      roomNumber: entry.roomNumber,
      leftRoomNumber: left.roomNumber,
      rightRoomNumber: right.roomNumber,
      leftId: left.player.id,
      rightId: right.player.id,
    }
  })
  return {
    ...base,
    publicPrompt: strictOrder
      ? 'Cada jugador conoce su cuarto. Los cuartos son consecutivos: izquierda es el numero anterior y derecha el siguiente. El primer cuarto conecta con el ultimo.'
      : 'Cada jugador conoce su cuarto. Los cuartos son consecutivos: encuentren los dos cuartos vecinos, sin importar el orden. El primer cuarto conecta con el ultimo.',
    publicInfo: {
      strictOrder,
      roomStart: roomNumberForIndex(0),
      roomEnd: roomNumberForIndex(order.length - 1),
      roomNumbers: order.map(entry => entry.roomNumber),
      wraps: true,
      rooms: order.map(entry => ({ roomNumber: entry.roomNumber, hidden: true })),
    },
    actionType: 'neighbor-pick',
  }
}

function buildMessageRound(room, base, players) {
  const messageCase = pickOne(MESSAGE_CASES)
  const decoyCount = Math.min(
    room.partyLine?.settings?.message?.decoyCount || 1,
    Math.max(1, players.length - 2)
  )
  const realCount = Math.max(1, players.length - decoyCount)
  const realFragments = messageCase.fragments.slice(0, realCount)
  const decoys = new Set(shuffle(players).slice(0, decoyCount).map(player => player.id))
  const decoyFragments = shuffle(messageCase.decoys)
  let realIndex = 0
  let decoyIndex = 0

  players.forEach((player, index) => {
    const isDecoy = decoys.has(player.id)
    base.assignments[player.id] = {
      fragment: isDecoy
        ? decoyFragments[decoyIndex++ % decoyFragments.length]
        : realFragments[realIndex++ % realFragments.length],
      isDecoy,
    }
  })

  return {
    ...base,
    title: messageCase.title,
    publicPrompt: `El mensaje real fue intervenido. Hay ${decoyCount} fragmento${decoyCount === 1 ? '' : 's'} falso${decoyCount === 1 ? '' : 's'}. Llamen, mientan y escriban la frase completa cuando crean tenerla.`,
    publicInfo: {
      decoyCount,
      realFragmentCount: realFragments.length,
      fragmentCount: players.length,
      title: messageCase.title,
      phraseWordCount: realFragments.join(' ').split(/\s+/).length,
    },
    secret: {
      message: realFragments.join(' '),
      realFragments,
      decoyIds: [...decoys],
    },
    actionType: 'message-reconstruct',
  }
}

function buildDilemmaRound(room, base, players) {
  const ordered = shuffle(players)
  const highStakes = !!room.partyLine?.settings?.dilemma?.highStakes
  const pairs = []
  for (let index = 0; index < ordered.length; index += 2) {
    pairs.push(ordered.slice(index, index + 2).map(player => player.id))
  }
  pairs.forEach(pair => {
    if (pair.length === 2) {
      const [a, b] = pair
      base.assignments[a] = { partnerId: b }
      base.assignments[b] = { partnerId: a }
    } else {
      base.assignments[pair[0]] = { partnerId: null, solo: true }
    }
  })

  return {
    ...base,
    publicPrompt: highStakes
      ? 'Pacten o traicionen. En esta ronda la traicion vale mas, pero fallar deja huella.'
      : 'Pacten o traicionen. Cada complice decide en secreto.',
    publicInfo: {
      highStakes,
      pairCount: pairs.length,
    },
    secret: { pairs },
    actionType: 'dilemma-choice',
  }
}

function buildIdentityRound(room, base, players) {
  const identityCase = pickOne(IDENTITY_CASES)
  const outsiderCount = Math.min(
    room.partyLine?.settings?.identity?.outsiderCount || 1,
    Math.max(1, players.length - 1)
  )
  const outsiders = new Set(shuffle(players).slice(0, outsiderCount).map(player => player.id))

  players.forEach(player => {
    const outsider = outsiders.has(player.id)
    base.assignments[player.id] = {
      identity: identityCase.role,
      role: identityCase.role,
      protocol: outsider ? identityCase.fakeProtocol : identityCase.realProtocol,
      keywords: outsider ? identityCase.trapWords : identityCase.safeWords,
      protocolStatus: outsider ? 'Protocolo alterado' : 'Protocolo oficial',
      isOutsider: outsider,
    }
  })

  return {
    ...base,
    title: identityCase.title,
    publicPrompt: identityCase.prompt,
    publicInfo: {
      outsiderCount,
      setting: identityCase.title,
      role: identityCase.role,
      commonLabel: 'Protocolo oficial',
      outsiderLabel: 'Protocolo falso',
      detailOptions: identityCase.detailOptions.map(option => ({
        id: option.id,
        label: option.label,
      })),
    },
    secret: {
      common: 'Protocolo oficial',
      outsider: 'Protocolo falso',
      outsiderIds: [...outsiders],
      role: identityCase.role,
      realProtocol: identityCase.realProtocol,
      fakeProtocol: identityCase.fakeProtocol,
      falseDetailId: identityCase.falseDetailId,
      falseDetailLabel: identityCase.detailOptions.find(option => option.id === identityCase.falseDetailId)?.label || 'Detalle falso',
    },
    actionType: 'protocol-accuse',
  }
}

export function publicPartyLineRound(room) {
  const round = room?.partyLine?.currentRound
  if (!round) return null
  return {
    id: round.id,
    round: round.round,
    totalRounds: room.partyLine?.totalRounds || 5,
    gameId: round.gameId,
    game: round.game,
    title: round.title || round.game?.title,
    publicPrompt: round.publicPrompt,
    publicInfo: round.publicInfo || {},
    actionType: round.actionType,
    players: round.players,
    submittedPlayerIds: Object.keys(round.submissions || {}),
    submittedCount: Object.keys(round.submissions || {}).length,
    totalPlayers: round.players.length,
  }
}

export function partyLinePrivateFor(room, playerId) {
  const round = room?.partyLine?.currentRound
  if (!round) return null
  const assignment = round.assignments?.[playerId]
  if (!assignment) return null
  const payload = {
    roundId: round.id,
    gameId: round.gameId,
    actionType: round.actionType,
    submitted: !!round.submissions?.[playerId],
  }
  if (round.gameId === 'neighbors') {
    return {
      ...payload,
      roomNumber: assignment.roomNumber,
      leftRoomNumber: assignment.leftRoomNumber,
      rightRoomNumber: assignment.rightRoomNumber,
      instruction: 'Tu cuarto es privado. Tus vecinos son el cuarto anterior y el siguiente. Llama para descubrir quien tiene cada numero.',
    }
  }
  if (round.gameId === 'message') {
    return {
      ...payload,
      fragment: assignment.fragment,
      isDecoy: assignment.isDecoy,
      instruction: assignment.isDecoy
        ? 'Tu fragmento es falso. Defiendelo por llamada para retrasar a quienes reconstruyen la frase.'
        : 'Tu fragmento pertenece al mensaje real. Junta versiones por llamada y escribe la frase completa.',
    }
  }
  if (round.gameId === 'dilemma') {
    const partner = round.players.find(player => player.id === assignment.partnerId)
    return {
      ...payload,
      partner,
      solo: !!assignment.solo,
      instruction: assignment.solo
        ? 'Quedaste como operador libre. Elige si mantienes perfil bajo o finges pacto.'
        : `Tu complice secreto es ${partner?.name || 'otro jugador'}. Negocia antes de decidir.`,
    }
  }
  return {
    ...payload,
    identity: assignment.identity,
    role: assignment.role,
    protocol: assignment.protocol,
    keywords: assignment.keywords,
    protocolStatus: assignment.protocolStatus,
    isOutsider: assignment.isOutsider,
    instruction: assignment.isOutsider
      ? 'Tu protocolo esta alterado. Defiendelo por llamada y siembra dudas sobre el procedimiento de los demas.'
      : 'Tu protocolo es oficial. Compara pasos por llamada y detecta quien trae una version alterada.',
  }
}

export function sanitizePartyLineAction(round, rawAction = {}) {
  if (!round || typeof rawAction !== 'object' || !rawAction) return null
  if (round.actionType === 'neighbor-pick') {
    return {
      leftId: typeof rawAction.leftId === 'string' ? rawAction.leftId : null,
      rightId: typeof rawAction.rightId === 'string' ? rawAction.rightId : null,
    }
  }
  if (round.actionType === 'suspect-list' || round.actionType === 'message-reconstruct') {
    const max = Math.max(1, Number(round.publicInfo?.decoyCount) || 1)
    const suspectIds = Array.isArray(rawAction.suspectIds) ? rawAction.suspectIds : []
    const cleanSuspectIds = [...new Set(suspectIds.filter(id => typeof id === 'string'))].slice(0, max)
    if (round.actionType === 'message-reconstruct') {
      return {
        phraseGuess: sanitizePhraseGuess(rawAction.phraseGuess),
        suspectIds: cleanSuspectIds,
      }
    }
    return { suspectIds: cleanSuspectIds }
  }
  if (round.actionType === 'dilemma-choice') {
    return { choice: rawAction.choice === 'betray' ? 'betray' : 'cooperate' }
  }
  if (round.actionType === 'single-suspect') {
    return { targetId: typeof rawAction.targetId === 'string' ? rawAction.targetId : null }
  }
  if (round.actionType === 'protocol-accuse') {
    return {
      targetId: typeof rawAction.targetId === 'string' ? rawAction.targetId : null,
      detailId: typeof rawAction.detailId === 'string' ? rawAction.detailId : null,
    }
  }
  return null
}

export function resolvePartyLineRound(room) {
  const round = room?.partyLine?.currentRound
  if (!round) return null
  if (round.gameId === 'neighbors') return resolveNeighbors(room, round)
  if (round.gameId === 'message') return resolveMessage(room, round)
  if (round.gameId === 'dilemma') return resolveDilemma(room, round)
  return resolveIdentity(room, round)
}

function applyScores(room, deltas, meta = {}) {
  const points = room.players
    .filter(player => roundHasPlayer(meta.round, player.id))
    .map(player => {
      const previous = room.partyLine.scores[player.id] || emptyPartyLineScore(player)
      const delta = deltas[player.id] || 0
      const next = {
        ...previous,
        name: player.name,
        avatar: normalizeAvatar(player.avatar, player.name),
        totalPoints: previous.totalPoints + delta,
        roundsWon: previous.roundsWon + (delta > 0 ? 1 : 0),
        lastDelta: delta,
      }
      room.partyLine.scores[player.id] = next
      return {
        playerId: player.id,
        name: player.name,
        avatar: normalizeAvatar(player.avatar, player.name),
        points: delta,
      }
    })
  return points
}

function roundHasPlayer(round, playerId) {
  return !round || round.players.some(player => player.id === playerId)
}

function baseResult(room, round, deltas, details) {
  const points = applyScores(room, deltas, { round })
  const result = {
    round: room.round,
    totalRounds: room.partyLine?.totalRounds || 5,
    gameId: round.gameId,
    game: round.game,
    title: round.title || round.game?.title,
    summary: details.summary,
    details: details.items || [],
    points,
    scoreboard: partyLineScoreboard(room),
  }
  room.partyLine.roundResult = result
  room.partyLine.history = [...(room.partyLine.history || []), result]
  return result
}

function resolveNeighbors(room, round) {
  const strict = round.publicInfo?.strictOrder !== false
  const deltas = {}
  const items = round.players.map(player => {
    const assignment = round.assignments[player.id]
    const action = round.submissions[player.id] || {}
    let correct = 0
    if (strict) {
      if (action.leftId === assignment.leftId) correct += 1
      if (action.rightId === assignment.rightId) correct += 1
    } else {
      const expected = new Set([assignment.leftId, assignment.rightId])
      if (expected.has(action.leftId)) correct += 1
      if (action.rightId !== action.leftId && expected.has(action.rightId)) correct += 1
    }
    deltas[player.id] = correct * 2
    const left = round.players.find(item => item.id === assignment.leftId)
    const right = round.players.find(item => item.id === assignment.rightId)
    return {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      label: `Cuarto ${assignment.roomNumber}`,
      value: `Izq ${assignment.leftRoomNumber}: ${left?.name || '?'} / Der ${assignment.rightRoomNumber}: ${right?.name || '?'}`,
      correct,
    }
  })
  return baseResult(room, round, deltas, {
    summary: 'El pasillo telefonico quedo reconstruido.',
    items,
  })
}

function resolveMessage(room, round) {
  const decoys = new Set(round.secret?.decoyIds || [])
  const realFragments = round.secret?.realFragments || []
  const deltas = {}
  const suspicionCounts = {}
  Object.values(round.submissions).forEach(action => {
    ;(action.suspectIds || []).forEach(id => {
      suspicionCounts[id] = (suspicionCounts[id] || 0) + 1
    })
  })

  const correctPhraseEntries = round.players
    .map(player => {
      const action = round.submissions[player.id] || {}
      return {
        playerId: player.id,
        submittedAt: action.submittedAt || Number.MAX_SAFE_INTEGER,
        phraseGuess: action.phraseGuess || '',
        correct: messageGuessMatches(action.phraseGuess, realFragments),
      }
    })
    .filter(entry => entry.correct)
    .sort((a, b) => a.submittedAt - b.submittedAt)
  const phraseRanks = new Map(correctPhraseEntries.map((entry, index) => [entry.playerId, index + 1]))

  round.players.forEach(player => {
    const action = round.submissions[player.id] || {}
    const hits = (action.suspectIds || []).filter(id => decoys.has(id)).length
    const misses = (action.suspectIds || []).filter(id => id && !decoys.has(id)).length
    const isDecoy = decoys.has(player.id)
    const caught = (suspicionCounts[player.id] || 0) >= Math.ceil(round.players.length / 2)
    const rank = phraseRanks.get(player.id)
    const phrasePoints = rank ? messageSpeedPoints(rank) : 0
    deltas[player.id] = phrasePoints + hits * 2 - misses + (isDecoy && !caught ? 3 : 0)
  })

  const items = round.players.map(player => {
    const rank = phraseRanks.get(player.id)
    const fake = decoys.has(player.id)
    return {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      label: fake
        ? rank ? `Fragmento falso / frase #${rank}` : 'Fragmento falso'
        : rank ? `Frase correcta #${rank}` : 'Fragmento real',
      value: round.assignments[player.id]?.fragment || '',
      votes: suspicionCounts[player.id] || 0,
    }
  })

  return baseResult(room, round, deltas, {
    summary: `Mensaje real: ${round.secret?.message || 'sin registro'}`,
    items,
  })
}

function resolveDilemma(room, round) {
  const highStakes = !!round.publicInfo?.highStakes
  const deltas = {}
  const items = []
  const handled = new Set()

  round.players.forEach(player => {
    if (handled.has(player.id)) return
    const assignment = round.assignments[player.id]
    const choice = round.submissions[player.id]?.choice || 'cooperate'
    if (assignment?.solo) {
      deltas[player.id] = choice === 'betray' ? 2 : 1
      handled.add(player.id)
      items.push({
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        label: 'Operador libre',
        value: choice === 'betray' ? 'Traiciono' : 'Coopero',
      })
      return
    }

    const partner = round.players.find(item => item.id === assignment?.partnerId)
    const partnerChoice = partner ? (round.submissions[partner.id]?.choice || 'cooperate') : 'cooperate'
    const betrayWin = highStakes ? 5 : 4
    if (choice === 'cooperate' && partnerChoice === 'cooperate') {
      deltas[player.id] = 2
      if (partner) deltas[partner.id] = 2
    } else if (choice === 'betray' && partnerChoice === 'cooperate') {
      deltas[player.id] = betrayWin
      if (partner) deltas[partner.id] = 0
    } else if (choice === 'cooperate' && partnerChoice === 'betray') {
      deltas[player.id] = 0
      if (partner) deltas[partner.id] = betrayWin
    } else {
      deltas[player.id] = highStakes ? -1 : 0
      if (partner) deltas[partner.id] = highStakes ? -1 : 0
    }
    handled.add(player.id)
    if (partner) handled.add(partner.id)
    items.push({
      playerId: player.id,
      name: partner ? `${player.name} / ${partner.name}` : player.name,
      avatar: player.avatar,
      label: 'Pacto secreto',
      value: `${choice === 'betray' ? 'Traicion' : 'Cooperacion'} / ${partnerChoice === 'betray' ? 'Traicion' : 'Cooperacion'}`,
    })
  })

  return baseResult(room, round, deltas, {
    summary: 'Los pactos quedaron revelados.',
    items,
  })
}

function resolveIdentity(room, round) {
  const outsiders = new Set(round.secret?.outsiderIds || [])
  const falseDetailId = round.secret?.falseDetailId
  const falseDetailLabel = round.secret?.falseDetailLabel || 'Detalle falso'
  const deltas = {}
  const voteCounts = {}
  Object.values(round.submissions).forEach(action => {
    if (action.targetId) voteCounts[action.targetId] = (voteCounts[action.targetId] || 0) + 1
  })
  const maxVotes = Math.max(0, ...Object.values(voteCounts))
  const leaders = Object.entries(voteCounts).filter(([, count]) => count === maxVotes).map(([id]) => id)
  const outsidersCaught = leaders.some(id => outsiders.has(id))
  const realLeaderBlamed = leaders.some(id => id && !outsiders.has(id))

  round.players.forEach(player => {
    const action = round.submissions[player.id] || {}
    const isOutsider = outsiders.has(player.id)
    const caughtTarget = outsiders.has(action.targetId)
    const guessedDetail = !!falseDetailId && action.detailId === falseDetailId
    deltas[player.id] = caughtTarget ? 3 + (guessedDetail ? 2 : 0) : action.targetId ? -1 : 0
    if (isOutsider && !outsidersCaught) deltas[player.id] += realLeaderBlamed ? 6 : 4
  })

  const items = round.players.map(player => ({
    playerId: player.id,
    name: player.name,
    avatar: player.avatar,
    label: outsiders.has(player.id) ? round.secret?.outsider : round.secret?.common,
    value: `${voteCounts[player.id] || 0} voto${(voteCounts[player.id] || 0) === 1 ? '' : 's'}${outsiders.has(player.id) ? ` - ${falseDetailLabel}` : ''}`,
  }))

  return baseResult(room, round, deltas, {
    summary: outsidersCaught
      ? `La mesa encontro un protocolo falso: ${falseDetailLabel}.`
      : 'El protocolo falso paso desapercibido.',
    items,
  })
}

export function partyLineGameOverPayload(room, roundResult) {
  const scoreboard = partyLineScoreboard(room)
  const leader = scoreboard[0] || null
  return {
    gameId: room.gameId,
    winner: 'partyline',
    reason: 'score',
    mode: 'partyline',
    playedAt: Date.now(),
    leader,
    partyLineScoreboard: scoreboard,
    roundResult,
    players: room.players.map(player => ({
      id: player.id,
      name: player.name,
      avatar: normalizeAvatar(player.avatar, player.name),
      profileId: player.profileId || null,
      isGuest: player.isGuest !== false || !player.profileId,
      role: 'partyline-player',
    })),
  }
}
