import { useEffect, useRef, useState } from 'react'
import { usePrefsStore } from '../store/prefsStore.js'
import { sfx } from '../utils/sfx.js'

export default function PrefsToggle({ style }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const sound = usePrefsStore(s => s.sound)
  const volume = usePrefsStore(s => s.volume ?? 0.8)
  const vibration = usePrefsStore(s => s.vibration)
  const setSound = usePrefsStore(s => s.setSound)
  const setVolume = usePrefsStore(s => s.setVolume)
  const toggleVibration = usePrefsStore(s => s.toggleVibration)
  const active = sound && volume > 0
  const volumePercent = Math.round(volume * 100)
  const supportsVibe = typeof navigator !== 'undefined' && 'vibrate' in navigator

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [open])

  const toggleSound = () => {
    if (active) {
      setSound(false)
      return
    }
    setSound(true)
    if (volume <= 0) setVolume(0.8)
    sfx.unlock()
    sfx.tap()
  }

  const changeVolume = (event) => {
    const next = Number(event.target.value) / 100
    setVolume(next)
    if (next > 0 && !sound) {
      setSound(true)
      sfx.unlock()
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 14, zIndex: 1200, ...style }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={active ? 'Configurar sonido' : 'Activar sonido'}
        aria-expanded={open}
        aria-controls="audio-preferences-panel"
        title={active ? `Sonido ${volumePercent}%` : 'Sin sonido'}
        style={mainButton(active)}
      >
        <SoundIcon on={active} />
      </button>

      {open && (
        <div
          id="audio-preferences-panel"
          role="dialog"
          aria-label="Preferencias de audio"
          style={panelStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 12 }}>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={active}
              style={toggleButton(active)}
            >
              <SoundIcon on={active} />
              <span>{active ? 'Sonido' : 'Silencio'}</span>
            </button>
            <span style={{
              minWidth: 44,
              textAlign: 'right',
              fontFamily: 'var(--font-num)',
              fontSize: 20,
              color: active ? 'var(--gold)' : 'var(--text-faint)',
              letterSpacing: '0.04em',
            }}>{volumePercent}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={volumePercent}
            onChange={changeVolume}
            aria-label="Volumen"
            style={{
              width: '100%',
              accentColor: 'var(--gold)',
              cursor: 'pointer',
            }}
          />

          {supportsVibe && (
            <button
              type="button"
              onClick={toggleVibration}
              aria-pressed={vibration}
              style={{
                ...toggleButton(vibration),
                marginTop: 12,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <VibeIcon on={vibration} />
              <span>{vibration ? 'Vibracion' : 'Sin vibracion'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function mainButton(active) {
  return {
    all: 'unset',
    cursor: 'pointer',
    width: 40,
    height: 40,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? 'rgba(245, 158, 11, 0.16)' : 'rgba(80, 80, 100, 0.2)',
    border: `1px solid ${active ? 'rgba(245, 158, 11, 0.58)' : 'var(--hairline-cold)'}`,
    color: active ? 'var(--gold)' : 'var(--text-faint)',
    boxShadow: active ? '0 0 22px -10px var(--gold-glow)' : '0 10px 24px rgba(0,0,0,0.28)',
    backdropFilter: 'blur(8px)',
    transition: 'all 160ms ease',
  }
}

function toggleButton(active) {
  return {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    minHeight: 36,
    maxWidth: '100%',
    padding: '0 12px',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: active ? 'rgba(245, 158, 11, 0.10)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${active ? 'rgba(245, 158, 11, 0.42)' : 'var(--hairline-cold)'}`,
    color: active ? 'var(--gold)' : 'var(--text-3)',
    fontFamily: 'var(--font-ui)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
}

const panelStyle = {
  position: 'absolute',
  top: 48,
  right: 0,
  width: 236,
  padding: 14,
  borderRadius: 14,
  background: 'linear-gradient(180deg, rgba(26,26,46,0.98), rgba(18,18,30,0.98))',
  border: '1px solid rgba(245, 158, 11, 0.26)',
  boxShadow: '0 24px 60px -18px rgba(0,0,0,0.85), 0 0 34px -18px var(--gold-glow)',
  backdropFilter: 'blur(12px)',
}

function SoundIcon({ on }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      {on ? (
        <>
          <path d="M15.5 8.5a5 5 0 010 7"/>
          <path d="M19 5a10 10 0 010 14"/>
        </>
      ) : (
        <>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </>
      )}
    </svg>
  )
}

function VibeIcon({ on }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: on ? 1 : 0.6 }}>
      <rect x="7" y="4" width="10" height="16" rx="2"/>
      <line x1="11" y1="18" x2="13" y2="18"/>
      {on && (
        <>
          <path d="M3 10v4"/>
          <path d="M21 10v4"/>
        </>
      )}
    </svg>
  )
}
