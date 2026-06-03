export default function Stepper({ value, min = 1, max = 99, onChange, accent = 'gold', size = 'md' }) {
  const color = accent === 'red' ? 'var(--impostor)' : 'var(--gold)'
  const big = size === 'lg'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      background: 'var(--surface-1)',
      borderRadius: 999,
      border: '1px solid var(--hairline-cold)',
      padding: 4, gap: 4,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
    }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: big ? 44 : 38, height: big ? 44 : 38, borderRadius: 999,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: value <= min ? 'var(--text-faint)' : color,
          fontFamily: 'var(--font-ui)', fontSize: 20, fontWeight: 300,
          cursor: value <= min ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >−</button>
      <div style={{
        minWidth: big ? 76 : 60, textAlign: 'center',
        fontFamily: 'var(--font-num)', fontSize: big ? 40 : 32,
        color: 'var(--text-1)', letterSpacing: '0.04em', lineHeight: 1,
        paddingTop: 4,
      }}>{value}</div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: big ? 44 : 38, height: big ? 44 : 38, borderRadius: 999,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: value >= max ? 'var(--text-faint)' : color,
          fontFamily: 'var(--font-ui)', fontSize: 20, fontWeight: 300,
          cursor: value >= max ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >+</button>
    </div>
  )
}
