import { useMemo } from 'react'

export default function ParticleField({ count = 26, color = '#ef4444' }) {
  const dots = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i * 37) % 100,
    y: (i * 83) % 100,
    s: 1 + ((i * 17) % 30) / 20,
    o: 0.05 + ((i * 11) % 20) / 100,
  })), [count])
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${d.x}%`, top: `${d.y}%`,
          width: d.s, height: d.s, borderRadius: 999,
          background: color, opacity: d.o,
          boxShadow: `0 0 ${d.s * 3}px rgba(220, 38, 38, 0.6)`,
        }} />
      ))}
    </div>
  )
}
