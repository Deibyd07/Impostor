export default function CircularTimer({ seconds = 8, total = 8, accent = 'citizen' }) {
  const r = 18, c = 2 * Math.PI * r
  const pct = total > 0 ? seconds / total : 0
  const color = accent === 'impostor' ? 'var(--impostor)'
              : accent === 'gold' ? 'var(--gold)' : 'var(--citizen)'
  return (
    <div className={`circular-timer circular-timer--${accent}`} style={{ position: 'relative', width: 44, height: 44 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle
          cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-num)', fontSize: 18,
        color: 'var(--text-1)', paddingTop: 3,
      }}>{seconds}</div>
    </div>
  )
}
