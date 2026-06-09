export default function ProfileIdentityPicker({
  profiles = [],
  value = 'guest',
  onChange,
  label = 'Jugar como',
  helper,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--text-2)',
      }}>
        {label}
      </label>
      <select
        value={value || 'guest'}
        onChange={(event) => onChange?.(event.target.value)}
        style={{
          width: '100%',
          minHeight: 42,
          borderRadius: 10,
          border: '1px solid var(--hairline-cold)',
          background: 'var(--surface-1)',
          color: 'var(--text-1)',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          fontWeight: 700,
          outline: 'none',
          padding: '0 12px',
        }}
      >
        <option value="guest">Invitado - sin ranking</option>
        {profiles.map(profile => (
          <option key={profile.id} value={profile.id}>
            {profile.avatar || ''} {profile.name}
          </option>
        ))}
      </select>
      {helper && (
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          lineHeight: 1.4,
          color: 'var(--text-3)',
        }}>
          {helper}
        </div>
      )}
    </div>
  )
}
