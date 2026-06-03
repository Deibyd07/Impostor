function Figure({ x, y, h, fill }) {
  const headR = h * 0.13
  const torsoTop = y + headR * 2 + 4
  return (
    <g>
      <circle cx={x + h * 0.18} cy={y + headR} r={headR} fill={fill} />
      <path d={`M ${x} ${y + h} L ${x + h * 0.04} ${torsoTop} Q ${x + h * 0.18} ${torsoTop - 6} ${x + h * 0.32} ${torsoTop} L ${x + h * 0.36} ${y + h} Z`} fill={fill} />
    </g>
  )
}

export default function BackgroundSilhouettes() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(110% 70% at 50% 35%, rgba(220, 38, 38, 0.18) 0%, transparent 55%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(80% 60% at 50% 110%, rgba(245, 158, 11, 0.08) 0%, transparent 65%)',
      }} />
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.42 }}>
        <g style={{ filter: 'blur(2px)', opacity: 0.6 }}>
          <Figure x={40} y={520} h={180} fill="#1a1a2e" />
          <Figure x={100} y={510} h={195} fill="#15152a" />
          <Figure x={170} y={525} h={170} fill="#1a1a2e" />
          <Figure x={240} y={510} h={195} fill="#15152a" />
          <Figure x={310} y={520} h={180} fill="#1a1a2e" />
        </g>
        <g style={{ filter: 'blur(0.8px)' }}>
          <Figure x={-10} y={490} h={260} fill="#0d0d1a" />
          <Figure x={300} y={500} h={250} fill="#0d0d1a" />
          <Figure x={150} y={480} h={290} fill="#070710" />
        </g>
        <g>
          <Figure x={188} y={420} h={140} fill="#080812" />
          <circle cx="208" cy="455" r="1.6" fill="#ef4444" filter="url(#redglow)" />
          <circle cx="219" cy="455" r="1.6" fill="#ef4444" filter="url(#redglow)" />
        </g>
        <defs>
          <filter id="redglow">
            <feGaussianBlur stdDeviation="1.5" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(7,7,15,0.5) 30%, var(--bg-base) 90%)',
      }} />
    </div>
  )
}
