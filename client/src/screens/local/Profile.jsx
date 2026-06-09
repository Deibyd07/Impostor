import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import {
  impostorRate,
  sortedPlayerStats,
  useStatsStore,
  winRate,
} from '../../store/statsStore.js'

export default function Profile() {
  const navigate = useNavigate()
  const playersByKey = useStatsStore(s => s.players)
  const players = useMemo(() => sortedPlayerStats(playersByKey), [playersByKey])
  const [selectedKey, setSelectedKey] = useState(null)

  const activeKey = players.some(player => player.key === selectedKey)
    ? selectedKey
    : players[0]?.key
  const selected = players.find(player => player.key === activeKey)

  return (
    <PhoneScreen>
      <div style={{
        minHeight: '100vh',
        padding: '0 22px 34px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <button onClick={() => navigate('/')} style={backButtonStyle}>Volver</button>
          <Badge color="var(--gold)" dot>Perfil</Badge>
        </header>

        <div>
          <div className="t-eyebrow" style={{ color: 'var(--gold)', marginBottom: 10 }}>Estadisticas</div>
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: 'var(--text-1)',
            textShadow: '0 0 24px var(--gold-glow)',
          }}>Jugadores</h1>
        </div>

        {!selected ? (
          <EmptyState />
        ) : (
          <>
            <PlayerSelector players={players} activeKey={activeKey} onSelect={setSelectedKey} />
            <PlayerSummary stats={selected} />
            <RoleBreakdown stats={selected} />
          </>
        )}
      </div>
    </PhoneScreen>
  )
}

function EmptyState() {
  return (
    <div className="evidence-panel profile-empty-state" style={{
      marginTop: 42,
      padding: '34px 22px',
      border: '1px solid var(--hairline-cold)',
      borderRadius: 16,
      background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        color: 'var(--text-1)',
        letterSpacing: '0.04em',
        marginBottom: 10,
      }}>Sin partidas</div>
      <div className="t-meta" style={{ lineHeight: 1.5 }}>
        Las estadisticas apareceran cuando termine una partida local u online.
      </div>
    </div>
  )
}

function PlayerSelector({ players, activeKey, onSelect }) {
  return (
    <section>
      <SectionHeader right={`${players.length} guardado${players.length === 1 ? '' : 's'}`}>Jugador</SectionHeader>
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 2,
      }}>
        {players.map(player => {
          const active = player.key === activeKey
          return (
            <button
              key={player.key}
              onClick={() => onSelect(player.key)}
              className={`profile-player-tab ${active ? 'is-active' : ''}`}
              style={{
                flex: '0 0 auto',
                minWidth: 104,
                padding: '12px 14px',
                borderRadius: 10,
                border: active ? '1px solid var(--gold)' : '1px solid var(--hairline-cold)',
                background: active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)',
                color: active ? 'var(--gold-soft)' : 'var(--text-2)',
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {player.name}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function PlayerSummary({ stats }) {
  const victories = winRate(stats)
  const impostor = impostorRate(stats)

  return (
    <section>
      <SectionHeader right={`${victories}% victorias`}>Resumen</SectionHeader>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
      }}>
        <Metric label="Partidas" value={stats.gamesPlayed} color="var(--gold)" />
        <Metric label="Victorias" value={stats.wins} color="var(--victory)" />
        <Metric label="Derrotas" value={stats.losses} color="var(--impostor)" />
        <Metric label="Racha" value={stats.currentStreak} color="var(--citizen)" />
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Bar label="Victorias" value={victories} color="var(--victory)" />
        <Bar label="Como impostor" value={impostor} color="var(--impostor)" />
      </div>
    </section>
  )
}

function RoleBreakdown({ stats }) {
  return (
    <section>
      <SectionHeader right={`Mejor racha ${stats.bestStreak}`}>Roles</SectionHeader>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
      }}>
        <RoleCard title="Impostor" games={stats.impostorGames} wins={stats.impostorWins} color="var(--impostor)" />
        <RoleCard title="Ciudadano" games={stats.citizenGames} wins={stats.citizenWins} color="var(--citizen)" />
      </div>
    </section>
  )
}

function Metric({ label, value, color }) {
  return (
    <div className="profile-metric-card" style={{
      minHeight: 86,
      padding: '16px 14px',
      borderRadius: 12,
      background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
      border: '1px solid var(--hairline-cold)',
    }}>
      <div className="t-eyebrow" style={{ color, fontSize: 9, marginBottom: 10 }}>{label}</div>
      <div className="t-num" style={{ fontSize: 36, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

function Bar({ label, value, color }) {
  const width = `${Math.max(0, Math.min(100, value))}%`

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 7,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-2)',
        fontSize: 12,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div style={{
        height: 10,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--hairline-cold)',
        overflow: 'hidden',
      }}>
        <div style={{
          width,
          height: '100%',
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 16px ${color}`,
        }} />
      </div>
    </div>
  )
}

function RoleCard({ title, games, wins, color }) {
  return (
    <div className="profile-role-card" style={{
      padding: '16px 14px',
      borderRadius: 12,
      border: `1px solid ${color}`,
      background: 'rgba(255,255,255,0.035)',
      minHeight: 104,
    }}>
      <div className="t-eyebrow" style={{ color, fontSize: 9, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="t-num" style={{ fontSize: 34, lineHeight: 1 }}>{games}</span>
        <span className="t-meta">partidas</span>
      </div>
      <div className="t-meta" style={{ marginTop: 8 }}>{wins} victorias</div>
    </div>
  )
}

const backButtonStyle = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-2)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}
