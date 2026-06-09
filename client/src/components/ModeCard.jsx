const palette = {
  red:  { color: 'var(--impostor)', glow: 'var(--impostor-glow)', soft: 'rgba(220,38,38,0.08)' },
  gold: { color: 'var(--gold)',     glow: 'var(--gold-glow)',     soft: 'rgba(245,158,11,0.08)' },
  blue: { color: 'var(--citizen)',  glow: 'var(--citizen-glow)',  soft: 'rgba(59,130,246,0.08)' },
}

export default function ModeCard({ icon, title, description, accent, selected, onClick }) {
  const colors = palette[accent] || palette.gold
  return (
    <button
      type="button"
      className={`mode-card mode-card--${accent || 'gold'} ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
      style={{
        all: 'unset', boxSizing: 'border-box',
        flex: 1, minWidth: 0, cursor: 'pointer',
        padding: '16px 12px 14px',
        background: selected
          ? `linear-gradient(180deg, ${colors.soft}, var(--surface-1) 70%)`
          : 'var(--surface-1)',
        border: `1px solid ${selected ? colors.color : 'var(--hairline-cold)'}`,
        borderRadius: 14,
        boxShadow: selected ? `0 0 28px -8px ${colors.glow}, inset 0 0 0 1px ${colors.color}` : 'none',
        opacity: selected ? 1 : 0.55,
        transition: 'all 0.2s ease',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}
    >
      <div style={{ fontSize: 26, lineHeight: 1, filter: selected ? 'none' : 'grayscale(0.4)' }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
        letterSpacing: '0.18em', color: selected ? colors.color : 'var(--text-2)',
      }}>{title}</div>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 11, lineHeight: 1.35,
        color: 'var(--text-2)', minHeight: 44,
      }}>{description}</div>
    </button>
  )
}
