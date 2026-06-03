export default function CornerOrnament({ color = 'rgba(245, 158, 11, 0.5)' }) {
  const c = { position: 'absolute', width: 26, height: 26, opacity: 0.7, pointerEvents: 'none' }
  const linePath = (
    <svg viewBox="0 0 26 26" width="26" height="26">
      <path d="M2 14 L 2 4 Q 2 2 4 2 L 14 2" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="2" cy="2" r="1.2" fill={color} />
    </svg>
  )
  return (
    <>
      <div style={{ ...c, top: 10, left: 10 }}>{linePath}</div>
      <div style={{ ...c, top: 10, right: 10, transform: 'scaleX(-1)' }}>{linePath}</div>
      <div style={{ ...c, bottom: 10, left: 10, transform: 'scaleY(-1)' }}>{linePath}</div>
      <div style={{ ...c, bottom: 10, right: 10, transform: 'scale(-1)' }}>{linePath}</div>
    </>
  )
}
