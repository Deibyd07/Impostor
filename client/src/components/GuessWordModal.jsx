import { useState, useEffect, useRef } from 'react'
import { useOnlineStore } from '../store/onlineStore.js'

export default function GuessWordModal({ open, onClose }) {
  const guessWord = useOnlineStore(s => s.guessWord)
  const guessAttempts = useOnlineStore(s => s.guessAttempts)
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef(null)
  const lastAttempts = useRef(guessAttempts)

  useEffect(() => {
    if (open) {
      setValue('')
      setSubmitted(false)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  useEffect(() => {
    if (guessAttempts > lastAttempts.current) {
      setSubmitted(false)
      lastAttempts.current = guessAttempts
    }
  }, [guessAttempts])

  if (!open) return null

  const submit = (e) => {
    e?.preventDefault()
    const w = value.trim()
    if (!w || submitted) return
    setSubmitted(true)
    guessWord(w)
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Adivinar palabra"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(7, 7, 15, 0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'fadeIn 180ms ease-out',
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380,
          background: 'linear-gradient(180deg, #1a0b12 0%, #0e0710 100%)',
          border: '1px solid rgba(255, 64, 80, 0.45)',
          borderRadius: 18, padding: '22px 20px 18px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(255,64,80,0.18)',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.32em',
          color: 'var(--impostor)', textAlign: 'center', marginBottom: 6, textTransform: 'uppercase',
        }}>
          Tu jugada final
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.1em',
          color: 'var(--text-1)', textAlign: 'center', margin: 0, marginBottom: 4,
        }}>
          ADIVINAR PALABRA
        </h2>
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.5,
          color: 'var(--text-3)', textAlign: 'center', margin: '0 0 18px',
        }}>
          Si aciertas, ganas la partida al instante. Si fallas, todos lo sabrán.
        </p>

        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe la palabra…"
          aria-label="Palabra a adivinar"
          style={{
            width: '100%', padding: '14px 16px', fontSize: 17,
            background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,64,80,0.4)',
            borderRadius: 10, color: 'var(--text-1)', fontFamily: 'var(--font-ui)',
            outline: 'none', textAlign: 'center', letterSpacing: '0.06em',
            marginBottom: 14,
          }}
        />

        {guessAttempts > 0 && (
          <div style={{
            fontSize: 11.5, color: 'var(--impostor)', textAlign: 'center',
            marginBottom: 12, fontFamily: 'var(--font-ui)', opacity: 0.85,
          }}>
            Intentos fallidos: {guessAttempts}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose}
            className="btn btn-ghost"
            style={{ flex: 1, padding: '12px 14px', fontSize: 12, letterSpacing: '0.18em' }}>
            Cancelar
          </button>
          <button type="submit"
            disabled={!value.trim() || submitted}
            style={{
              flex: 1.4, padding: '12px 14px', fontSize: 12, letterSpacing: '0.18em',
              fontFamily: 'var(--font-ui)', fontWeight: 600, textTransform: 'uppercase',
              background: !value.trim() || submitted
                ? 'rgba(255,64,80,0.25)'
                : 'linear-gradient(180deg, #d92638 0%, #8a1422 100%)',
              color: '#fff',
              border: '1px solid rgba(255,64,80,0.7)',
              borderRadius: 10,
              cursor: !value.trim() || submitted ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(217, 38, 56, 0.35)',
              transition: 'transform 120ms ease',
            }}
          >
            {submitted ? 'Enviando…' : 'Acusar palabra'}
          </button>
        </div>
      </form>
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}
