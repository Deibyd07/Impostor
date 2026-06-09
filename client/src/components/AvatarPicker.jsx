import { PLAYER_AVATARS } from '../data/avatars.js'

export default function AvatarPicker({ value, onChange, columns = 6 }) {
  return (
    <div className="avatar-picker" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: 8,
    }}>
      {PLAYER_AVATARS.map(avatar => {
        const selected = avatar === value
        return (
          <button
            key={avatar}
            type="button"
            title={`Avatar ${avatar}`}
            aria-label={`Elegir avatar ${avatar}`}
            aria-pressed={selected}
            className={`avatar-option ${selected ? 'is-selected' : ''}`}
            onClick={() => onChange?.(avatar)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              height: 42,
              borderRadius: 10,
              background: selected ? 'rgba(245, 158, 11, 0.14)' : 'var(--surface-1)',
              border: `1px solid ${selected ? 'var(--gold)' : 'var(--hairline-cold)'}`,
              boxShadow: selected ? '0 0 18px -8px var(--gold-glow)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 23,
              lineHeight: 1,
            }}
          >
            {avatar}
          </button>
        )
      })}
    </div>
  )
}
