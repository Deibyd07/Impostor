import GameIcon from './GameIcon.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'

export default function VoteCard({ name, avatar, votes = 0, isLeader = false, disabled = false, onClick }) {
  const intensity = Math.min(1, votes / 3)
  return (
    <button
      type="button"
      className={`vote-card ${isLeader ? 'is-leader' : ''} ${votes > 0 ? 'has-votes' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        all: 'unset', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '18px 12px 14px',
        background: votes > 0
          ? `linear-gradient(180deg, rgba(207, 59, 52, ${0.05 + intensity * 0.25}), rgba(207, 59, 52, ${intensity * 0.06}))`
          : 'var(--surface-1)',
        border: `1px solid ${isLeader ? 'var(--impostor)' : votes > 0 ? 'rgba(207, 59, 52, 0.45)' : 'var(--hairline-cold)'}`,
        borderRadius: 16,
        textAlign: 'center',
        transition: 'all 0.18s',
        animation: isLeader ? 'pulseGlow 1.6s ease-in-out infinite' : 'none',
        boxShadow: isLeader ? 'var(--sh-impostor)' : votes > 0 ? `0 0 20px -10px var(--impostor-glow)` : 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <GameIcon name="cardTarget" size={15} className="vote-card__target-icon" />
      <div style={{
        width: 56, height: 56, borderRadius: 999,
        background: votes > 0
          ? 'linear-gradient(135deg, #321114, #240f10)'
          : 'linear-gradient(135deg, #2a1b20, #211519)',
        color: votes > 0 ? 'var(--impostor)' : 'var(--gold)',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: avatar ? 28 : 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 10px',
        lineHeight: 1,
        boxShadow: votes > 0
          ? '0 0 20px -4px var(--impostor-glow), inset 0 0 0 1px rgba(207, 59, 52, 0.5)'
          : 'inset 0 0 0 1px rgba(214, 164, 80, 0.18)',
      }}>
        <PlayerAvatar
          avatar={avatar}
          name={name}
          style={{ width: '100%', height: '100%', borderRadius: 999, fontSize: avatar ? 28 : 24 }}
        />
      </div>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500,
        color: 'var(--text-1)', marginBottom: 6,
      }}>{name}</div>
      <div style={{
        fontFamily: 'var(--font-num)', fontSize: 17, letterSpacing: '0.06em',
        color: votes > 0 ? 'var(--impostor)' : 'var(--text-faint)',
        textShadow: votes > 0 ? '0 0 10px var(--impostor-glow)' : 'none',
      }}>▲ {votes} voto{votes === 1 ? '' : 's'}</div>
    </button>
  )
}
