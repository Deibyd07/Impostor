export default function Badge({ children, color = 'var(--gold)', dot = false, warn = false, size = 'md' }) {
  const fs = size === 'sm' ? 9 : 10
  return (
    <span className={`case-badge case-badge--${size}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: size === 'sm' ? '4px 8px 4px 7px' : '5px 10px 5px 8px',
      background: 'rgba(0,0,0,0.4)',
      border: `1px solid ${color}`,
      borderRadius: 999,
      fontFamily: 'var(--font-ui)', fontSize: fs, fontWeight: 700,
      letterSpacing: '0.28em', color, textTransform: 'uppercase',
      boxShadow: `0 0 12px -2px ${color === 'var(--impostor)' ? 'var(--impostor-glow)' : 'transparent'}`,
      whiteSpace: 'nowrap',
    }}>
      {warn ? (
        <span style={{ fontSize: 11, lineHeight: 1 }}>⚠</span>
      ) : dot ? (
        <span style={{
          width: 6, height: 6, borderRadius: 999, background: color,
          boxShadow: `0 0 6px ${color}`,
        }} />
      ) : null}
      {children}
    </span>
  )
}
