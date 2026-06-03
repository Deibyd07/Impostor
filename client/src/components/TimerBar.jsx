export default function TimerBar({ progress = 0.6, totalSeconds, accent = 'red', label }) {
  const color = accent === 'red' ? 'var(--impostor)'
              : accent === 'gold' ? 'var(--gold)' : 'var(--citizen)'
  const remaining = typeof totalSeconds === 'number'
    ? Math.max(0, Math.round(progress * totalSeconds))
    : null
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="t-meta" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</span>
          {remaining !== null && (
            <span style={{
              fontFamily: 'var(--font-num)', color: 'var(--text-1)',
              fontSize: 18, letterSpacing: '0.05em',
            }}>{remaining}s</span>
          )}
        </div>
      )}
      <div style={{
        height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          background: `linear-gradient(90deg, ${color}, ${color === 'var(--impostor)' ? '#fb7185' : color})`,
          boxShadow: `0 0 12px ${color}`, borderRadius: 999,
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  )
}
