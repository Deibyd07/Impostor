import Badge from './Badge.jsx'

export default function ConnectedPlayer({
  name, avatar, isHost = false, placeholder = false, status = 'ready', isYou = false,
}) {
  if (placeholder) {
    return (
      <div className="connected-player connected-player--placeholder" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 12,
        border: '1px dashed rgba(245, 158, 11, 0.2)',
        background: 'transparent', opacity: 0.4,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 999,
          border: '1px dashed var(--text-faint)',
        }} />
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: 13,
          color: 'var(--text-faint)', fontStyle: 'italic',
        }}>Esperando jugador…</span>
      </div>
    )
  }
  const displayAvatar = avatar || (name || '?').charAt(0).toUpperCase()
  return (
    <div className={`connected-player ${isYou ? 'is-you' : ''}`} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 12,
      background: isYou ? 'rgba(245, 158, 11, 0.06)' : 'var(--surface-1)',
      border: `1px solid ${isYou ? 'rgba(245, 158, 11, 0.4)' : 'var(--hairline-cold)'}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 999,
        background: 'linear-gradient(135deg, #2a2a45, #15152a)',
        color: 'var(--gold)',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: avatar ? 18 : 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(245, 158, 11, 0.25)',
        flexShrink: 0,
        lineHeight: 1,
      }}>{displayAvatar}</div>
      <span style={{
        flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500,
        color: 'var(--text-1)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}{isYou && <span style={{ color: 'var(--text-3)', fontSize: 11, marginLeft: 8 }}>(tú)</span>}</span>
      {isHost && <Badge color="var(--gold)" size="sm">HOST</Badge>}
      <span title={status} style={{
        width: 8, height: 8, borderRadius: 999,
        background: status === 'ready' ? 'var(--victory)' : 'var(--gold)',
        boxShadow: `0 0 6px ${status === 'ready' ? 'var(--victory)' : 'var(--gold)'}`,
        flexShrink: 0,
      }} />
    </div>
  )
}
