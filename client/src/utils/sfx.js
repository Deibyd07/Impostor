import { usePrefsStore } from '../store/prefsStore.js'

const SOUND_BASE = '/sounds/'

const MUSIC = {
  lobby: { src: 'menu-lobby-loop.mp3', volume: 0.34 },
  discussion: { src: 'discusion-loop.mp3', volume: 0.24 },
  interrogation: { src: 'interrogatorio-detective-loop.mp3', volume: 0.36 },
  voting: { src: 'votacion-loop.mp3', volume: 0.3 },
  /* loopEnd: el archivo tiene ~5s de silencio final; re-buclamos antes */
  partyline: { src: 'linea-privada-loop.mp3', volume: 0.26, loopStart: 0.02, loopEnd: 77.6 },
}

const EVENTS = {
  startGame: { src: 'inicio-partida.mp3', volume: 0.72 },
  startVoting: { src: 'inicio-votacion.mp3', volume: 0.76 },
  startInterrogation: { src: 'inicio-interrogatorio.mp3', volume: 0.78 },
  chatMessage: { src: 'mensaje-chat.mp3', volume: 0.52 },
  eliminate: { src: 'jugador-eliminado.mp3', volume: 0.78 },
  tie: { src: 'empate.mp3', volume: 0.72 },
  guessCorrect: { src: 'adivinanza-correcta.mp3', volume: 0.78 },
  guessWrong: { src: 'adivinanza-incorrecta.mp3', volume: 0.72 },
  revealCitizen: { src: 'revelar-ciudadano.mp3', volume: 0.68 },
  revealImpostor: { src: 'revelar-impostor.mp3', volume: 0.78 },
  revealImpostorClue: { src: 'revelar-impostor-pista.mp3', volume: 0.78 },
  revealImpostorBlind: { src: 'revelar-impostor-ciego.mp3', volume: 0.72 },
  revealDetective: { src: 'revelar-detective.mp3', volume: 0.82 },
  winCitizens: { src: 'victoria-ciudadanos.mp3', volume: 0.84 },
  winImpostor: { src: 'victoria-impostor.mp3', volume: 0.84 },
  /* startAt: salta el silencio inicial medido en cada archivo para que el
     sonido golpee exactamente cuando se dispara */
  uiTap: { src: 'ui-click.mp3', volume: 0.9 },
  slam: { src: 'golpe-expediente.mp3', volume: 0.8, startAt: 0.55 },
  cardFlip: { src: 'voltear-carta.mp3', volume: 0.62, startAt: 0.14 },
  stamp: { src: 'sello-goma.mp3', volume: 0.74, startAt: 0.52 },
  typewriter: { src: 'maquina-escribir.mp3', volume: 0.5, startAt: 0.18 },
  phoneRing: { src: 'telefono-llamada.mp3', volume: 0.62, startAt: 0.59 },
  phonePickup: { src: 'telefono-contestar.mp3', volume: 0.6, startAt: 0.03 },
  phoneHangup: { src: 'telefono-colgar.mp3', volume: 0.58, startAt: 0.09 },
  partySubmit: { src: 'decision-enviada.mp3', volume: 0.6, startAt: 0.21 },
}

let ctx = null
let currentMusic = null
let currentMusicKey = null
let desiredMusicKey = null
let unlockListenersReady = false

const audioCache = new Map()

function globalMusicVolume() {
  const v = Number(usePrefsStore.getState().musicVolume)
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1
}

function globalSfxVolume() {
  const v = Number(usePrefsStore.getState().sfxVolume)
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1
}

function soundEnabled() {
  const prefs = usePrefsStore.getState()
  return prefs.sound && globalSfxVolume() > 0
}

function musicSoundEnabled() {
  const prefs = usePrefsStore.getState()
  return prefs.sound && globalMusicVolume() > 0
}

function effectiveVolume(def, isMusic = false) {
  return (def?.volume ?? 0.7) * (isMusic ? globalMusicVolume() : globalSfxVolume())
}

function updateCachedVolumes() {
  if (!canUseAudio()) return
  audioCache.forEach((audio, key) => {
    const isLoop = key.startsWith('loop:')
    const src = key.split(':')[1]
    const def = isLoop
      ? Object.values(MUSIC).find(item => item.src === src)
      : Object.values(EVENTS).find(item => item.src === src)
    if (def) audio.volume = effectiveVolume(def, isLoop)
  })
}

function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function canUseAudio() {
  return typeof window !== 'undefined' && typeof window.Audio === 'function'
}

function assetUrl(src) {
  return `${SOUND_BASE}${src}`
}

function getAudio(def, { loop = false } = {}) {
  if (!def?.src || !canUseAudio()) return null
  const key = `${loop ? 'loop' : 'shot'}:${def.src}`
  if (!audioCache.has(key)) {
    const audio = new window.Audio(assetUrl(def.src))
    audio.preload = 'auto'
    audio.loop = loop
    audio.volume = effectiveVolume(def, loop)
    audioCache.set(key, audio)
  }
  const audio = audioCache.get(key)
  audio.loop = loop
  audio.volume = effectiveVolume(def, loop)
  // bucles con silencio final: saltar de loopEnd a loopStart sin esperar al EOF
  if (loop && def.loopEnd && !audio.dataset?.loopTrimmed) {
    audio.addEventListener('timeupdate', () => {
      if (audio.currentTime >= def.loopEnd) {
        audio.currentTime = def.loopStart || 0
      }
    })
    if (audio.dataset) audio.dataset.loopTrimmed = '1'
  }
  return audio
}

function playEvent(name, fallback) {
  if (!soundEnabled()) return
  const def = EVENTS[name]
  const audio = getAudio(def)
  if (!audio) {
    fallback?.()
    return
  }
  try {
    audio.pause()
    audio.currentTime = def.startAt || 0
    audio.play().catch(() => {})
  } catch {
    fallback?.()
  }
}

function stopEvent(name) {
  const def = EVENTS[name]
  if (!def?.src || !audioCache.has(`shot:${def.src}`)) return
  const audio = audioCache.get(`shot:${def.src}`)
  try {
    audio.pause()
    audio.currentTime = def.startAt || 0
  } catch {}
}

function stopActiveMusic({ clearDesired = false } = {}) {
  if (clearDesired) desiredMusicKey = null
  if (!currentMusic) {
    currentMusicKey = null
    return
  }
  try {
    currentMusic.pause()
    currentMusic.currentTime = 0
  } catch {}
  currentMusic = null
  currentMusicKey = null
}

function startMusic(key) {
  desiredMusicKey = key
  if (!key || !MUSIC[key]) {
    stopActiveMusic({ clearDesired: !key })
    return
  }
  if (!musicSoundEnabled()) {
    stopActiveMusic()
    return
  }
  if (currentMusicKey === key && currentMusic) {
    currentMusic.play().catch(() => {})
    return
  }
  stopActiveMusic()
  const audio = getAudio(MUSIC[key], { loop: true })
  if (!audio) return
  currentMusic = audio
  currentMusicKey = key
  audio.currentTime = 0
  audio.play().catch(() => {})
}

function preloadAssets() {
  if (!canUseAudio()) return
  Object.values(MUSIC).forEach(def => getAudio(def, { loop: true }))
  Object.values(EVENTS).forEach(def => getAudio(def))
}

function unlockAudio() {
  const c = ac()
  if (c?.state === 'suspended') c.resume().catch(() => {})
  preloadAssets()
  if (desiredMusicKey) startMusic(desiredMusicKey)
}

function registerUnlockListeners() {
  if (unlockListenersReady || typeof window === 'undefined') return
  unlockListenersReady = true
  const unlock = () => {
    unlockAudio()
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

function tone({
  freq = 440, dur = 0.2, type = 'sine',
  attack = 0.005, decay = 0.05, sustain = 0.6, release = 0.1,
  gain = 0.2, freqEnd, slideTime,
} = {}) {
  const c = ac()
  if (!c || !soundEnabled()) return
  const scaledGain = gain * globalSfxVolume()
  const t0 = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freqEnd && slideTime) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, freqEnd), t0 + slideTime)
  }
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(scaledGain, t0 + attack)
  g.gain.linearRampToValueAtTime(scaledGain * sustain, t0 + attack + decay)
  g.gain.linearRampToValueAtTime(0, t0 + dur + release)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + release + 0.02)
}

function noise({ dur = 0.15, gain = 0.18, filterHz = 1200 } = {}) {
  const c = ac()
  if (!c || !soundEnabled()) return
  const scaledGain = gain * globalSfxVolume()
  const t0 = c.currentTime
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6
  const src = c.createBufferSource()
  src.buffer = buf
  const flt = c.createBiquadFilter()
  flt.type = 'lowpass'
  flt.frequency.value = filterHz
  const g = c.createGain()
  g.gain.setValueAtTime(scaledGain, t0)
  g.gain.linearRampToValueAtTime(0, t0 + dur)
  src.connect(flt)
  flt.connect(g)
  g.connect(c.destination)
  src.start(t0)
}

function vibrate(pattern) {
  if (!usePrefsStore.getState().vibration) return
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern) } catch {}
  }
}

const fallback = {
  tap() {
    tone({ freq: 880, dur: 0.04, type: 'sine', gain: 0.08, release: 0.04 })
  },
  slam() {
    // golpe sordo de papel contra madera
    tone({ freq: 120, freqEnd: 46, slideTime: 0.16, dur: 0.18, type: 'sine', gain: 0.3, release: 0.12 })
    noise({ dur: 0.16, gain: 0.22, filterHz: 700 })
    setTimeout(() => noise({ dur: 0.1, gain: 0.08, filterHz: 2400 }), 30)
  },
  cardFlip() {
    // roce rápido de cartulina
    noise({ dur: 0.12, gain: 0.1, filterHz: 3200 })
    setTimeout(() => noise({ dur: 0.08, gain: 0.07, filterHz: 4200 }), 70)
  },
  stamp() {
    // sello de goma: golpe seco + rebote corto
    tone({ freq: 180, freqEnd: 70, slideTime: 0.08, dur: 0.1, type: 'square', gain: 0.16, release: 0.06 })
    noise({ dur: 0.09, gain: 0.16, filterHz: 1100 })
    setTimeout(() => noise({ dur: 0.05, gain: 0.06, filterHz: 2000 }), 90)
  },
  typewriter() {
    // ráfaga corta de teclas
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        tone({ freq: 1500 + (i % 3) * 240, dur: 0.018, type: 'square', gain: 0.05, release: 0.02 })
        noise({ dur: 0.025, gain: 0.05, filterHz: 3600 })
      }, i * 105)
    }
  },
  phoneRing() {
    // timbre clásico de dos tonos
    ;[0, 460].forEach(offset => {
      setTimeout(() => {
        tone({ freq: 440, dur: 0.32, type: 'sine', gain: 0.12, release: 0.05 })
        tone({ freq: 480, dur: 0.32, type: 'sine', gain: 0.12, release: 0.05 })
      }, offset)
    })
  },
  phonePickup() {
    noise({ dur: 0.05, gain: 0.12, filterHz: 1600 })
    setTimeout(() => tone({ freq: 620, dur: 0.06, type: 'sine', gain: 0.1, release: 0.04 }), 50)
  },
  phoneHangup() {
    tone({ freq: 480, dur: 0.07, type: 'sine', gain: 0.1, release: 0.04 })
    setTimeout(() => noise({ dur: 0.06, gain: 0.12, filterHz: 1200 }), 60)
  },
  revealImpostor() {
    tone({ freq: 140, freqEnd: 50, slideTime: 0.6, dur: 0.6, type: 'square', gain: 0.16, release: 0.3 })
    tone({ freq: 70, freqEnd: 40, slideTime: 0.6, dur: 0.6, type: 'sine', gain: 0.18, release: 0.3 })
    setTimeout(() => noise({ dur: 0.3, gain: 0.12, filterHz: 400 }), 60)
  },
  revealCitizen() {
    tone({ freq: 523.25, dur: 0.18, type: 'sine', gain: 0.13 })
    setTimeout(() => tone({ freq: 783.99, dur: 0.22, type: 'sine', gain: 0.13 }), 110)
  },
  vote() {
    tone({ freq: 260, dur: 0.06, type: 'triangle', gain: 0.14, release: 0.05 })
  },
  eliminate() {
    tone({ freq: 330, freqEnd: 110, slideTime: 0.5, dur: 0.5, type: 'sawtooth', gain: 0.18, release: 0.2 })
    noise({ dur: 0.22, gain: 0.1, filterHz: 800 })
  },
  tie() {
    tone({ freq: 200, dur: 0.18, type: 'square', gain: 0.12 })
    setTimeout(() => tone({ freq: 180, dur: 0.18, type: 'square', gain: 0.12 }), 200)
  },
  winCitizens() {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => tone({ freq, dur: 0.18, type: 'triangle', gain: 0.16 }), i * 110)
    })
  },
  winImpostor() {
    tone({ freq: 80, dur: 0.9, type: 'sawtooth', gain: 0.2, release: 0.4 })
    tone({ freq: 55, dur: 1.0, type: 'square', gain: 0.16, release: 0.4 })
    setTimeout(() => noise({ dur: 0.5, gain: 0.12, filterHz: 350 }), 100)
  },
}

function eliminationAccent({ wasImpostor = false } = {}) {
  tone({ freq: 96, freqEnd: 42, slideTime: 0.78, dur: 0.78, type: 'sawtooth', gain: 0.22, release: 0.28 })
  tone({ freq: 52, freqEnd: 34, slideTime: 0.9, dur: 0.9, type: 'sine', gain: 0.2, release: 0.34 })
  noise({ dur: 0.28, gain: 0.14, filterHz: 520 })
  setTimeout(() => noise({ dur: 0.18, gain: 0.1, filterHz: 1200 }), 560)
  setTimeout(() => {
    if (wasImpostor) {
      tone({ freq: 392, dur: 0.18, type: 'triangle', gain: 0.14, release: 0.14 })
      setTimeout(() => tone({ freq: 587.33, dur: 0.22, type: 'triangle', gain: 0.13, release: 0.18 }), 120)
      return
    }
    tone({ freq: 196, freqEnd: 98, slideTime: 0.34, dur: 0.34, type: 'square', gain: 0.13, release: 0.18 })
    setTimeout(() => tone({ freq: 82.41, dur: 0.28, type: 'sawtooth', gain: 0.1, release: 0.22 }), 120)
  }, 1450)
}

usePrefsStore.subscribe((state, previous) => {
  const soundChanged = state.sound !== previous.sound
  const musicVolChanged = state.musicVolume !== previous.musicVolume
  const sfxVolChanged = state.sfxVolume !== previous.sfxVolume
  if (!soundChanged && !musicVolChanged && !sfxVolChanged) return

  updateCachedVolumes()

  if (!state.sound || globalMusicVolume() <= 0) {
    stopActiveMusic()
  } else if (soundChanged || musicVolChanged) {
    unlockAudio()
  }
})

registerUnlockListeners()

export const sfx = {
  unlock: unlockAudio,

  music(key) {
    startMusic(key)
  },

  stopMusic() {
    stopActiveMusic({ clearDesired: true })
  },

  tap() {
    fallback.tap()
  },

  reveal() {
    playEvent('revealCitizen', fallback.revealCitizen)
    vibrate([40, 30, 70])
  },

  revealCitizen() {
    playEvent('revealCitizen', fallback.revealCitizen)
    vibrate(35)
  },

  revealImpostor() {
    playEvent('revealImpostor', fallback.revealImpostor)
    vibrate([60, 40, 120, 50, 180])
  },

  revealImpostorClue() {
    playEvent('revealImpostorClue', fallback.revealImpostor)
    vibrate([60, 40, 120, 50, 180])
  },

  revealImpostorBlind({ conceal = true } = {}) {
    if (conceal) {
      this.revealCitizen()
      return
    }
    playEvent('revealImpostorBlind', fallback.revealCitizen)
    vibrate([35, 25, 55])
  },

  revealDetective() {
    playEvent('revealDetective', fallback.revealCitizen)
    vibrate([50, 30, 90])
  },

  revealRole(role, { concealBlind = true } = {}) {
    if (role === 'detective-impostor') return this.revealDetective()
    if (role === 'detective') return this.revealDetective()
    if (role === 'impostor-clue') return this.revealImpostorClue()
    if (role === 'impostor-blind') return this.revealImpostorBlind({ conceal: concealBlind })
    if (role === 'impostor') return this.revealImpostor()
    return this.revealCitizen()
  },

  vote() {
    fallback.vote()
    vibrate(20)
  },

  voteCast() {
    tone({ freq: 660, dur: 0.07, type: 'sine', gain: 0.16 })
    setTimeout(() => tone({ freq: 880, dur: 0.09, type: 'sine', gain: 0.14 }), 70)
    vibrate(30)
  },

  startGame() {
    playEvent('startGame')
    vibrate([35, 25, 55])
  },

  startVoting() {
    playEvent('startVoting')
    vibrate([50, 40, 70])
  },

  startInterrogation() {
    playEvent('startInterrogation')
    vibrate([80, 40, 120])
  },

  chatMessage() {
    playEvent('chatMessage')
  },

  eliminate({ wasImpostor = false } = {}) {
    playEvent('eliminate', fallback.eliminate)
    eliminationAccent({ wasImpostor })
    vibrate(wasImpostor ? [90, 40, 130, 60, 90] : [90, 50, 160, 80, 180])
  },

  tie() {
    playEvent('tie', fallback.tie)
    vibrate([40, 60, 40])
  },

  guessWrong() {
    playEvent('guessWrong', fallback.tie)
    vibrate([40, 40, 80])
  },

  guessCorrect() {
    playEvent('guessCorrect', fallback.winCitizens)
    vibrate([50, 30, 50, 30, 100])
  },

  winCitizens() {
    playEvent('winCitizens', fallback.winCitizens)
    vibrate([60, 40, 60, 40, 120])
  },

  winImpostor() {
    playEvent('winImpostor', fallback.winImpostor)
    vibrate([120, 80, 200, 80, 300])
  },

  tick() {
    tone({ freq: 1200, dur: 0.02, type: 'square', gain: 0.05, release: 0.02 })
  },

  uiTap() {
    playEvent('uiTap', fallback.tap)
  },

  slam() {
    playEvent('slam', fallback.slam)
    vibrate([50, 20, 30])
  },

  cardFlip() {
    playEvent('cardFlip', fallback.cardFlip)
  },

  stamp() {
    playEvent('stamp', fallback.stamp)
    vibrate(45)
  },

  typewriter() {
    playEvent('typewriter', fallback.typewriter)
  },

  stopTypewriter() {
    stopEvent('typewriter')
  },

  phoneRing() {
    playEvent('phoneRing', fallback.phoneRing)
    vibrate([80, 60, 80])
  },

  stopPhoneRing() {
    stopEvent('phoneRing')
  },

  phonePickup() {
    playEvent('phonePickup', fallback.phonePickup)
  },

  phoneHangup() {
    playEvent('phoneHangup', fallback.phoneHangup)
  },

  partySubmit() {
    playEvent('partySubmit', fallback.vote)
    vibrate(30)
  },
}
