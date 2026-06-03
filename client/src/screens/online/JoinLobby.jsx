import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function JoinLobby() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const connect = useOnlineStore(s => s.connect)
  const connected = useOnlineStore(s => s.connected)
  const joinRoom = useOnlineStore(s => s.joinRoom)
  const roomCode = useOnlineStore(s => s.roomCode)
  const error = useOnlineStore(s => s.error)
  const clearError = useOnlineStore(s => s.clearError)
  const phase = useOnlineStore(s => s.phase)
  const [code, setCode] = useState((search.get('code') || '').toUpperCase().slice(0, 4))
  const [name, setName] = useState('')

  useEffect(() => { connect() }, [connect])
  useEffect(() => {
    if (roomCode) navigate('/online/waiting')
  }, [roomCode, navigate])
  useEffect(() => {
    if (phase === 'reveal') navigate('/online/card')
  }, [phase, navigate])

  const codeReady = code.length === 4
  const ready = codeReady && name.trim().length > 0 && connected

  const onJoin = () => { clearError(); joinRoom(code, name.trim()) }

  return (
    <PhoneScreen
      footer={
        <button
          className="btn btn-primary"
          disabled={!ready}
          onClick={onJoin}
          style={{ padding: '18px 20px', letterSpacing: '0.2em' }}
        >
          Unirse a la sala
        </button>
      }
    >
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13,
        }}>← Volver</button>
        <Badge color="var(--citizen)" dot>Unirse</Badge>
      </div>

      <div style={{ padding: '40px 28px 0' }}>
        <div className="t-eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>Sala privada</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32,
          color: 'var(--text-1)', textAlign: 'center', letterSpacing: '0.04em', lineHeight: 1.05,
        }}>Introduce<br />el código</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
          {[0, 1, 2, 3].map(i => {
            const ch = code[i]
            const active = code.length === i
            return (
              <div key={i} style={{
                width: 56, height: 64, borderRadius: 12,
                background: 'var(--surface-1)',
                border: `1px solid ${active ? 'var(--gold)' : ch ? 'rgba(245, 158, 11, 0.35)' : 'var(--hairline-cold)'}`,
                boxShadow: active ? '0 0 18px -4px var(--gold-glow)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32,
                color: 'var(--text-1)', textTransform: 'uppercase',
              }}>{ch || (active && <span style={{ width: 2, height: 28, background: 'var(--gold)', animation: 'caretBlink 1s steps(2) infinite' }} />)}</div>
            )
          })}
        </div>

        <input
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
          maxLength={4}
          style={{
            display: 'block', width: 0, height: 0,
            opacity: 0, position: 'absolute', pointerEvents: 'none',
          }}
        />
        <button onClick={(e) => { const inp = e.currentTarget.parentNode.querySelector('input'); inp?.focus() }}
          style={{
            all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center',
            marginTop: 14, color: 'var(--gold)', fontFamily: 'var(--font-ui)',
            fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>Toca para escribir código</button>

        <div style={{ marginTop: 36 }}>
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-2)',
            letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 8,
          }}>Tu nombre</div>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Carlos" maxLength={16}
            style={{
              width: '100%', padding: '14px 16px', boxSizing: 'border-box',
              background: 'var(--surface-1)',
              border: '1px solid var(--hairline-cold)', borderRadius: 12,
              color: 'var(--text-1)', fontFamily: 'var(--font-ui)',
              fontSize: 16, fontWeight: 500, outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            color: 'var(--impostor)', fontSize: 13, textAlign: 'center',
          }}>{error}</div>
        )}
      </div>
    </PhoneScreen>
  )
}
