export default function ChipGroup({ options, value, onChange, accent = 'gold' }) {
  const color = accent === 'red' ? 'var(--impostor)' : 'var(--gold)'
  return (
    <div className={`chip-group chip-group--${accent}`} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        const active = v === value
        return (
          <button
            type="button"
            key={v}
            className={`chip-option ${active ? 'is-active' : ''}`}
            onClick={() => onChange(v)}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '8px 14px', borderRadius: 999,
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
              background: active ? 'rgba(214, 164, 80, 0.1)' : 'var(--surface-1)',
              border: `1px solid ${active ? color : 'var(--hairline-cold)'}`,
              color: active ? color : 'var(--text-2)',
              transition: 'all 0.15s ease',
            }}
          >{label}</button>
        )
      })}
    </div>
  )
}
