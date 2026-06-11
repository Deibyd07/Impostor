import { useMemo } from 'react'

export default function Confetti({ count = 36 }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i * 41) % 100,
    y: (i * 97) % 80,
    rot: (i * 23) % 360,
    s: 4 + ((i * 7) % 8),
    color: i % 3 === 0 ? 'var(--gold)' : i % 3 === 1 ? 'var(--citizen)' : 'var(--victory)',
    delay: (i * 0.07) % 2,
  })), [count])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(60% 50% at 50% 30%, rgba(90, 158, 107, 0.16), transparent 65%),' +
          'radial-gradient(70% 50% at 50% 10%, rgba(214, 164, 80, 0.18), transparent 60%)',
      }} />
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', top: `${p.y}%`, left: `${p.x}%`,
          width: p.s, height: p.s * 0.4, background: p.color,
          transform: `rotate(${p.rot}deg)`,
          opacity: 0.85,
          boxShadow: `0 0 8px ${p.color}`,
          animation: `confettiFall 4s ease-in ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}
