import { usePrefsStore } from '../store/prefsStore.js'
import { sfx } from '../utils/sfx.js'

export default function PrefsToggle({ style }) {
  const sound = usePrefsStore(s => s.sound)
  const vibration = usePrefsStore(s => s.vibration)
  const toggleSound = usePrefsStore(s => s.toggleSound)
  const toggleVibration = usePrefsStore(s => s.toggleVibration)

  const supportsVibe = typeof navigator !== 'undefined' && 'vibrate' in navigator

  return (
    <div style={{ display: 'flex', gap: 8, ...style }}>
      <button
        type="button"
        onClick={() => { toggleSound(); if (!sound) { sfx.unlock(); sfx.tap() } }}
        aria-label={sound ? 'Silenciar sonido' : 'Activar sonido'}
        aria-pressed={sound}
        title={sound ? 'Sonido activo' : 'Sin sonido'}
        style={iconBtn(sound)}
      >
        <SoundIcon on={sound} />
      </button>
      {supportsVibe && (
        <button
          type="button"
          onClick={toggleVibration}
          aria-label={vibration ? 'Desactivar vibración' : 'Activar vibración'}
          aria-pressed={vibration}
          title={vibration ? 'Vibración activa' : 'Sin vibración'}
          style={iconBtn(vibration)}
        >
          <VibeIcon on={vibration} />
        </button>
      )}
    </div>
  )
}

function iconBtn(active) {
  return {
    all: 'unset',
    cursor: 'pointer',
    width: 36, height: 36, borderRadius: 999,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'rgba(245, 158, 11, 0.10)' : 'rgba(80, 80, 100, 0.08)',
    border: `1px solid ${active ? 'rgba(245, 158, 11, 0.45)' : 'var(--hairline-cold)'}`,
    color: active ? 'var(--gold)' : 'var(--text-faint)',
    transition: 'all 160ms ease',
  }
}

function SoundIcon({ on }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
