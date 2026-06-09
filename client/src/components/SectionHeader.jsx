export default function SectionHeader({ children, accent = 'gold', right }) {
  const color = accent === 'red' ? 'var(--impostor)' : 'var(--gold)'
  return (
    <div className={`section-header section-header--${accent}`} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span className="t-eyebrow" style={{ color }}>{children}</span>
        <span style={{
          flex: 1, height: 1,
          background: 'linear-gradient(90deg, currentColor 0%, transparent 100%)',
          color, opacity: 0.45,
        }} />
        {right && (
          <span style={{
            color: 'var(--text-2)', fontFamily: 'var(--font-ui)',
            fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>{right}</span>
        )}
      </div>
    </div>
  )
}
