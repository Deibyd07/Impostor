import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeader from './SectionHeader.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'
import { useGlobalLeaderboardStore } from '../store/globalLeaderboardStore.js'

export default function RoundScoreboard({ scoreSummary, syncKey }) {
  const [tab, setTab] = useState('room')
  const shouldReduceMotion = useReducedMotion()
  const globalPlayers = useGlobalLeaderboardStore(s => s.players)
  const globalLoading = useGlobalLeaderboardStore(s => s.loading)
  const globalAvailable = useGlobalLeaderboardStore(s => s.available)
  const globalError = useGlobalLeaderboardStore(s => s.error)
  const loadLeaderboard = useGlobalLeaderboardStore(s => s.loadLeaderboard)

  const profileIds = useMemo(() => new Set(
    (scoreSummary?.roomScoreboard || [])
      .map(player => player.profileId)
      .filter(Boolean)
  ), [scoreSummary])

  useEffect(() => {
    const delay = shouldReduceMotion ? 0 : 900
    const timer = setTimeout(() => loadLeaderboard(), delay)
    return () => clearTimeout(timer)
  }, [loadLeaderboard, shouldReduceMotion, syncKey])

  if (!scoreSummary?.roomScoreboard?.length) return null

  return (
    <section style={{ width: '100%', maxWidth: 420, margin: '24px auto 18px' }}>
      <SectionHeader right={<ScoreTabs value={tab} onChange={setTab} />}>
        Puntos de ronda
      </SectionHeader>

      <div style={panelStyle}>
        <div style={summaryStripStyle}>
          <strong>Expediente de sala</strong>
          <span>+3 jugar · +10 victoria · +5 impostor · +3 mejor racha</span>
        </div>

        {tab === 'room' ? (
          <RoomRanking summary={scoreSummary} reduceMotion={shouldReduceMotion} />
        ) : (
          <GlobalRanking
            players={globalPlayers}
            loading={globalLoading}
            available={globalAvailable}
            error={globalError}
            profileIds={profileIds}
            onRefresh={loadLeaderboard}
          />
        )}
      </div>
    </section>
  )
}

function ScoreTabs({ value, onChange }) {
  return (
    <span style={tabsStyle}>
      <button type="button" onClick={() => onChange('room')} style={tabButtonStyle(value === 'room')}>
        Sala
      </button>
      <button type="button" onClick={() => onChange('global')} style={tabButtonStyle(value === 'global')}>
        Global
      </button>
    </span>
  )
}

function RoomRanking({ summary, reduceMotion }) {
  const pointsById = new Map((summary.roundPoints || []).map(player => [player.playerId, player]))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {summary.roomScoreboard.map((player, index) => {
        const round = pointsById.get(player.playerId)
        return (
          <motion.article
            key={player.playerId}
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.32, ease: 'easeOut' }}
            style={roomRowStyle(player.rank)}
          >
            <div className="t-num" style={{ color: 'var(--gold)', fontSize: 23 }}>{player.rank}</div>
            <PlayerAvatar avatar={player.avatar} name={player.name} style={avatarStyle} />
            <div style={{ minWidth: 0 }}>
              <div style={nameStyle}>{player.name}</div>
              <div className="t-meta">
                {round?.won ? 'Gano la ronda' : 'Sobrevivio al expediente'} · racha {player.currentStreak}
              </div>
              <div style={breakdownStyle}>
                {(round?.breakdown || []).map(item => (
                  <span key={`${player.playerId}-${item.label}`}>{item.label} +{item.points}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <AnimatedPoints value={round?.points || player.lastDelta || 0} reduceMotion={reduceMotion} />
              <div className="t-meta">{player.totalPoints} total</div>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}

function GlobalRanking({ players, loading, available, error, profileIds, onRefresh }) {
  if (loading) return <EmptyBlock>Cargando ranking global...</EmptyBlock>
  if (available === false) {
    return (
      <EmptyBlock>
        Ranking global no disponible.
        {error ? <span style={{ color: 'var(--impostor)', marginTop: 6 }}>{error}</span> : null}
        <button type="button" onClick={onRefresh} style={refreshButtonStyle}>Reintentar</button>
      </EmptyBlock>
    )
  }
  if (!players.length) return <EmptyBlock>Aun no hay jugadores en el ranking global.</EmptyBlock>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {players.slice(0, 10).map(player => {
        const highlighted = profileIds.has(player.profileId)
        return (
          <article key={player.profileId} style={globalRowStyle(highlighted)}>
            <div className="t-num" style={{ color: highlighted ? 'var(--citizen)' : 'var(--gold)', fontSize: 23 }}>
              {player.rank}
            </div>
            <PlayerAvatar avatar={player.avatar} name={player.name} style={avatarStyle} />
            <div style={{ minWidth: 0 }}>
              <div style={nameStyle}>{player.name}</div>
              <div className="t-meta">
                {player.gamesPlayed} partidas · {player.wins} victorias · racha {player.currentStreak}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="t-num" style={{ color: highlighted ? 'var(--citizen)' : 'var(--text-1)', fontSize: 24 }}>
                {player.score}
              </div>
              <div className="t-meta">pts</div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function EmptyBlock({ children }) {
  return (
    <div className="t-meta" style={{
      minHeight: 124,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      lineHeight: 1.45,
      padding: 16,
    }}>
      {children}
    </div>
  )
}

function AnimatedPoints({ value, reduceMotion }) {
  const [display, setDisplay] = useState(reduceMotion ? value : 0)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      return undefined
    }
    let frame = 0
    const start = performance.now()
    const duration = 700
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      setDisplay(Math.round(value * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion, value])

  return (
    <div className="t-num" style={{
      color: 'var(--gold)',
      fontSize: 27,
      textShadow: '0 0 18px var(--gold-glow)',
    }}>
      +{display}
    </div>
  )
}

const panelStyle = {
  padding: 12,
  borderRadius: 16,
  border: '1px solid rgba(214, 164, 80, 0.34)',
  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(22, 14, 17, 0.94))',
  boxShadow: '0 20px 50px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.03)',
}

const summaryStripStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 12,
  border: '1px solid rgba(214, 164, 80, 0.20)',
  background: 'rgba(214, 164, 80, 0.06)',
  color: 'var(--text-2)',
  fontFamily: 'var(--font-ui)',
  fontSize: 11,
  lineHeight: 1.35,
}

const tabsStyle = {
  display: 'inline-flex',
  padding: 3,
  borderRadius: 999,
  border: '1px solid var(--hairline-cold)',
  background: 'rgba(255,255,255,0.04)',
}

function tabButtonStyle(active) {
  return {
    all: 'unset',
    cursor: 'pointer',
    padding: '6px 9px',
    borderRadius: 999,
    color: active ? 'var(--gold)' : 'var(--text-3)',
    background: active ? 'rgba(214, 164, 80, 0.14)' : 'transparent',
    fontFamily: 'var(--font-ui)',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  }
}

function roomRowStyle(rank) {
  return {
    display: 'grid',
    gridTemplateColumns: '28px 42px 1fr auto',
    gap: 10,
    alignItems: 'center',
    padding: '11px 10px',
    borderRadius: 13,
    border: `1px solid ${rank === 1 ? 'rgba(214, 164, 80, 0.50)' : 'rgba(195, 171, 140, 0.20)'}`,
    background: rank === 1 ? 'rgba(214, 164, 80, 0.10)' : 'rgba(255,255,255,0.035)',
  }
}

function globalRowStyle(highlighted) {
  return {
    display: 'grid',
    gridTemplateColumns: '28px 42px 1fr auto',
    gap: 10,
    alignItems: 'center',
    padding: '11px 10px',
    borderRadius: 13,
    border: `1px solid ${highlighted ? 'rgba(94, 138, 166, 0.62)' : 'rgba(195, 171, 140, 0.20)'}`,
    background: highlighted ? 'rgba(94, 138, 166, 0.11)' : 'rgba(255,255,255,0.035)',
  }
}

const avatarStyle = {
  width: 38,
  height: 38,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(214, 164, 80, 0.38)',
  background: 'rgba(214, 164, 80, 0.09)',
  fontSize: 19,
}

const nameStyle = {
  fontFamily: 'var(--font-display)',
  color: 'var(--text-1)',
  fontSize: 16,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const breakdownStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 5,
  marginTop: 6,
  color: 'var(--text-3)',
  fontFamily: 'var(--font-ui)',
  fontSize: 9,
  lineHeight: 1.2,
}

const refreshButtonStyle = {
  all: 'unset',
  cursor: 'pointer',
  marginTop: 10,
  color: 'var(--gold)',
  fontFamily: 'var(--font-ui)',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}
