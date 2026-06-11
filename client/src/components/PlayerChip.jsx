import { useState, useRef, useEffect } from 'react'
import AvatarPicker from './AvatarPicker.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'

export default function PlayerChip({
  name, avatar, eliminated = false, voted = 0, disconnected = false,
  onChange, onRemove, onAvatarChange, editable = false,
}) {
  const [editing, setEditing] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = (val) => {
    setEditing(false)
    const cleaned = (val ?? '').trim()
    if (cleaned && cleaned !== name) onChange?.(cleaned)
  }

  const canPickAvatar = editable && !eliminated && onAvatarChange

  return (
    <div className={`player-chip ${eliminated ? 'is-eliminated' : ''}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: eliminated ? 'rgba(15, 15, 25, 0.6)' : 'var(--surface-2)',
      border: `1px solid ${eliminated ? 'rgba(207, 59, 52,0.25)' : 'var(--hairline-cold)'}`,
      borderRadius: 999,
      padding: '6px 12px 6px 6px',
      opacity: eliminated ? 0.45 : 1,
      position: 'relative',
      maxWidth: '100%',
    }}>
      <button
        type="button"
        title={canPickAvatar ? 'Cambiar avatar' : undefined}
        onClick={() => canPickAvatar && setAvatarOpen(open => !open)}
        style={{
          all: 'unset',
          width: 26, height: 26, borderRadius: 999,
          background: eliminated
            ? 'linear-gradient(135deg, #321114, #110404)'
            : 'linear-gradient(135deg, #3d2a30, #261a1e)',
          color: eliminated ? 'var(--impostor)' : 'var(--gold)',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: avatar ? 15 : 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 0 0 1px rgba(214, 164, 80, 0.2)',
          flexShrink: 0,
          cursor: canPickAvatar ? 'pointer' : 'default',
          lineHeight: 1,
        }}
      >
        <PlayerAvatar
          avatar={avatar}
          name={name}
          style={{ width: '100%', height: '100%', borderRadius: 999, fontSize: avatar ? 15 : 13 }}
        />
      </button>
      {avatarOpen && canPickAvatar && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 30,
          width: 300,
          maxWidth: 'calc(100vw - 48px)',
          padding: 10,
          borderRadius: 14,
          background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
          border: '1px solid var(--hairline-cold)',
          boxShadow: 'var(--sh-card)',
        }}>
          <AvatarPicker
            value={avatar}
            onChange={(nextAvatar) => {
              onAvatarChange(nextAvatar)
              setAvatarOpen(false)
            }}
          />
        </div>
      )}
      {editing ? (
        <input
          ref={inputRef}
          defaultValue={name}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.target.value)
            if (e.key === 'Escape') setEditing(false)
          }}
          maxLength={14}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-1)', fontFamily: 'var(--font-ui)',
            fontSize: 14, fontWeight: 500, width: Math.max(60, name.length * 8),
          }}
        />
      ) : (
        <span
          onClick={() => editable && !eliminated && setEditing(true)}
          style={{
            fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 14,
            color: 'var(--text-1)',
            textDecoration: eliminated ? 'line-through' : 'none',
            cursor: editable && !eliminated ? 'text' : 'default',
            maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >{name}</span>
      )}
      {voted > 0 && (
        <span style={{
          fontFamily: 'var(--font-num)', fontSize: 14,
          color: 'var(--impostor)', marginLeft: 2, paddingTop: 2,
        }}>▲{voted}</span>
      )}
      {disconnected && !eliminated && (
        <span
          title="Desconectado — esperando reconexión"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontFamily: 'var(--font-ui)', fontSize: 10,
            color: 'var(--text-3)', marginLeft: 2,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}
        >
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: 99,
            background: '#f4c460', opacity: 0.7,
            animation: 'pulseGlow 1.4s ease-in-out infinite',
          }}/>
          off
        </span>
      )}
      {onRemove && !eliminated && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'transparent', border: 'none', color: 'var(--text-faint)',
            cursor: 'pointer', padding: '0 2px', fontSize: 14, marginLeft: 2, marginRight: -4,
          }}
        >×</button>
      )}
    </div>
  )
}
