export default function ChipGroup({ options, value, onChange, accent = 'gold' }) {
  const color = accent === 'red' ? 'var(--impostor)' : 'var(--gold)'
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        const active = v === value
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '8px 14px', borderRadius: 999,
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
              background: active ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface-1)',
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
