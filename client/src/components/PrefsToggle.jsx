import { useEffect, useRef, useState } from 'react'
import { usePrefsStore } from '../store/prefsStore.js'
import { sfx } from '../utils/sfx.js'

export default function PrefsToggle({ style }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const sound = usePrefsStore(s => s.sound)
  const musicVolume = usePrefsStore(s => s.musicVolume ?? 1)
  const sfxVolume = usePrefsStore(s => s.sfxVolume ?? 1)
  const vibration = usePrefsStore(s => s.vibration)
  const setSound = usePrefsStore(s => s.setSound)
  const setMusicVolume = usePrefsStore(s => s.setMusicVolume)
  const setSfxVolume = usePrefsStore(s => s.setSfxVolume)
  const toggleVibration = usePrefsStore(s => s.toggleVibration)

  const active = sound && (musicVolume > 0 || sfxVolume > 0)
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
    sfx.unlock()
    sfx.tap()
  }

  return (
    <div className="prefs-toggle" ref={rootRef} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 14, zIndex: 1200, ...style }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={active ? 'Configurar sonido' : 'Activar sonido'}
        aria-expanded={open}
        aria-controls="audio-preferences-panel"
        title={active ? `Música ${Math.round(musicVolume * 100)}%  ·  Efectos ${Math.round(sfxVolume * 100)}%` : 'Sin sonido'}
        className={`prefs-toggle__button ${active ? 'is-active' : ''}`}
        style={mainButton(active)}
      >
        <SoundIcon on={active} />
      </button>

      {open && (
        <div
          id="audio-preferences-panel"
          role="dialog"
          aria-label="Preferencias de audio"
          className="prefs-panel"
          style={panelStyle}
        >
          {/* master on/off */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <button type="button" onClick={toggleSound} aria-pressed={active} style={toggleButton(active)}>
              <SoundIcon on={active} />
              <span>{active ? 'Sonido' : 'Silencio'}</span>
            </button>
          </div>

          {/* música */}
          <VolumeRow
            label="Música"
            icon={<MusicIcon />}
            value={musicVolume}
            disabled={!sound}
            onChange={setMusicVolume}
          />

          {/* efectos */}
          <VolumeRow
            label="Efectos"
            icon={<SfxIcon />}
            value={sfxVolume}
            disabled={!sound}
            onChange={setSfxVolume}
            onPointerUp={() => { if (sound && sfxVolume > 0) sfx.uiTap() }}
          />

          {supportsVibe && (
            <button
              type="button"
              onClick={toggleVibration}
              aria-pressed={vibration}
              style={{ ...toggleButton(vibration), marginTop: 14, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}
            >
              <VibeIcon on={vibration} />
              <span>{vibration ? 'Vibración' : 'Sin vibración'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function VolumeRow({ label, icon, value, disabled, onChange, onPointerUp }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={rowLabel(disabled)}>
          {icon}
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-num)',
          fontSize: 16,
          color: disabled ? 'var(--text-faint)' : 'var(--gold)',
          letterSpacing: '0.04em',
          minWidth: 36,
          textAlign: 'right',
        }}>
          {pct}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={pct}
        disabled={disabled}
        aria-label={label}
        onChange={e => onChange(Number(e.target.value) / 100)}
        onPointerUp={onPointerUp}
        style={{
          '--fill': value,
          width: '100%',
          height: 4,
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          borderRadius: 999,
          background: disabled
            ? 'rgba(255,255,255,0.08)'
            : `linear-gradient(to right, rgba(214,164,80,0.9) 0%, rgba(214,164,80,0.9) ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
          opacity: disabled ? 0.38 : 1,
          transition: 'opacity 180ms ease',
        }}
      />
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
    background: active ? 'rgba(214, 164, 80, 0.16)' : 'rgba(80, 80, 100, 0.2)',
    border: `1px solid ${active ? 'rgba(214, 164, 80, 0.58)' : 'var(--hairline-cold)'}`,
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
    background: active ? 'rgba(214, 164, 80, 0.10)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${active ? 'rgba(214, 164, 80, 0.42)' : 'var(--hairline-cold)'}`,
    color: active ? 'var(--gold)' : 'var(--text-3)',
    fontFamily: 'var(--font-ui)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
}

function rowLabel(disabled) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-ui)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: disabled ? 'var(--text-faint)' : 'var(--text-2)',
  }
}

const panelStyle = {
  position: 'absolute',
  top: 48,
  right: 0,
  width: 248,
  padding: 14,
  borderRadius: 14,
  background: 'linear-gradient(180deg, rgba(26,26,46,0.98), rgba(36, 23, 27,0.98))',
  border: '1px solid rgba(214, 164, 80, 0.26)',
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

function MusicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

function SfxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.5 8.5a5 5 0 010 7"/>
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
