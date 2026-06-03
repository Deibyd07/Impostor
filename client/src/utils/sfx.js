// SFX sintetizado con Web Audio API + vibración. Sin assets.
import { usePrefsStore } from '../store/prefsStore.js'

let ctx = null
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

function tone({
  freq = 440, dur = 0.2, type = 'sine',
  attack = 0.005, decay = 0.05, sustain = 0.6, release = 0.1,
  gain = 0.2, freqEnd, slideTime,
} = {}) {
  const c = ac()
  if (!c) return
  if (!usePrefsStore.getState().sound) return
  const t0 = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freqEnd && slideTime) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, freqEnd), t0 + slideTime)
  }
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + attack)
  g.gain.linearRampToValueAtTime(gain * sustain, t0 + attack + decay)
  g.gain.linearRampToValueAtTime(0, t0 + dur + release)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + release + 0.02)
}

function noise({ dur = 0.15, gain = 0.18, filterHz = 1200 } = {}) {
  const c = ac()
  if (!c) return
  if (!usePrefsStore.getState().sound) return
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
  g.gain.setValueAtTime(gain, t0)
  g.gain.linearRampToValueAtTime(0, t0 + dur)
  src.connect(flt); flt.connect(g); g.connect(c.destination)
  src.start(t0)
}

function vibrate(pattern) {
  if (!usePrefsStore.getState().vibration) return
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern) } catch {}
  }
}

export const sfx = {
  unlock() {
    const c = ac()
    if (c?.state === 'suspended') c.resume().catch(() => {})
  },

  tap() {
    tone({ freq: 880, dur: 0.04, type: 'sine', gain: 0.08, release: 0.04 })
  },

  reveal() {
    tone({ freq: 220, freqEnd: 90, slideTime: 0.45, dur: 0.45, type: 'sawtooth', gain: 0.18, release: 0.2 })
    setTimeout(() => noise({ dur: 0.18, gain: 0.08, filterHz: 600 }), 120)
    vibrate([40, 30, 70])
  },

  revealImpostor() {
    tone({ freq: 140, freqEnd: 50, slideTime: 0.6, dur: 0.6, type: 'square', gain: 0.16, release: 0.3 })
    tone({ freq: 70, freqEnd: 40, slideTime: 0.6, dur: 0.6, type: 'sine', gain: 0.18, release: 0.3 })
    setTimeout(() => noise({ dur: 0.3, gain: 0.12, filterHz: 400 }), 60)
    vibrate([60, 40, 120, 50, 180])
  },

  revealCitizen() {
    tone({ freq: 523.25, dur: 0.18, type: 'sine', gain: 0.13 })
    setTimeout(() => tone({ freq: 783.99, dur: 0.22, type: 'sine', gain: 0.13 }), 110)
    vibrate(35)
  },

  vote() {
    tone({ freq: 260, dur: 0.06, type: 'triangle', gain: 0.14, release: 0.05 })
    vibrate(20)
  },

  voteCast() {
    tone({ freq: 660, dur: 0.07, type: 'sine', gain: 0.16 })
    setTimeout(() => tone({ freq: 880, dur: 0.09, type: 'sine', gain: 0.14 }), 70)
    vibrate(30)
  },

  eliminate() {
    tone({ freq: 330, freqEnd: 110, slideTime: 0.5, dur: 0.5, type: 'sawtooth', gain: 0.18, release: 0.2 })
    noise({ dur: 0.22, gain: 0.1, filterHz: 800 })
    vibrate([80, 60, 120])
  },

  tie() {
    tone({ freq: 200, dur: 0.18, type: 'square', gain: 0.12 })
    setTimeout(() => tone({ freq: 180, dur: 0.18, type: 'square', gain: 0.12 }), 200)
    vibrate([40, 60, 40])
  },

  winCitizens() {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => setTimeout(() => {
      tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.16 })
    }, i * 110))
    vibrate([60, 40, 60, 40, 120])
  },

  winImpostor() {
    tone({ freq: 80, dur: 0.9, type: 'sawtooth', gain: 0.2, release: 0.4 })
    tone({ freq: 55, dur: 1.0, type: 'square', gain: 0.16, release: 0.4 })
    setTimeout(() => noise({ dur: 0.5, gain: 0.12, filterHz: 350 }), 100)
    vibrate([120, 80, 200, 80, 300])
  },

  tick() {
    tone({ freq: 1200, dur: 0.02, type: 'square', gain: 0.05, release: 0.02 })
  },
}
