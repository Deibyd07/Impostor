import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import PlayerAvatar from '../../components/PlayerAvatar.jsx'
import { useGlobalLeaderboardStore } from '../../store/globalLeaderboardStore.js'

export default function Ranking() {
  const navigate = useNavigate()
  const players = useGlobalLeaderboardStore(s => s.players)
  const loading = useGlobalLeaderboardStore(s => s.loading)
  const available = useGlobalLeaderboardStore(s => s.available)
  const error = useGlobalLeaderboardStore(s => s.error)
  const loadLeaderboard = useGlobalLeaderboardStore(s => s.loadLeaderboard)

  useEffect(() => { loadLeaderboard() }, [loadLeaderboard])

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
          <Badge color="var(--citizen)" dot>Global</Badge>
        </header>

        <div>
          <div className="t-eyebrow" style={{ color: 'var(--gold)', marginBottom: 10 }}>Clasificacion</div>
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: 'var(--text-1)',
            textShadow: '0 0 24px var(--gold-glow)',
          }}>Ranking global</h1>
          <p className="t-meta" style={{ marginTop: 10, lineHeight: 1.5 }}>
            Solo cuentan partidas terminadas con perfiles de jugador.
          </p>
        </div>

        <section>
          <SectionHeader right={<button type="button" onClick={loadLeaderboard} style={refreshButtonStyle}>Actualizar</button>}>
            Mejores jugadores
          </SectionHeader>
          <div style={boardStyle}>
            {loading ? (
              <EmptyRanking>Cargando ranking...</EmptyRanking>
            ) : available === false ? (
              <EmptyRanking>
                Ranking no disponible. Intenta actualizar en un momento.
                {error ? <span style={{ color: 'var(--impostor)', marginTop: 8 }}>{error}</span> : null}
              </EmptyRanking>
            ) : players.length === 0 ? (
              <EmptyRanking>Aun no hay partidas globales registradas.</EmptyRanking>
            ) : (
              players.map(player => (
                <article key={player.profileId} style={rowStyle(player.rank)}>
                  <div className="t-num" style={{ color: 'var(--gold)', fontSize: 27 }}>
                    {player.rank}
                  </div>
                  <PlayerAvatar avatar={player.avatar} name={player.name} style={avatarStyle} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text-1)',
                      fontSize: 18,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{player.name}</div>
                    <div className="t-meta">
                      {player.gamesPlayed} partidas - {player.wins} victorias - racha {player.currentStreak}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="t-num" style={{ color: 'var(--citizen)', fontSize: 27 }}>
                      {player.score}
                    </div>
                    <div className="t-meta">pts</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </PhoneScreen>
  )
}

function EmptyRanking({ children }) {
  return (
    <div className="t-meta" style={{
      minHeight: 160,
      padding: 22,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

function rowStyle(rank) {
  return {
    display: 'grid',
    gridTemplateColumns: '38px 44px 1fr auto',
    gap: 11,
    alignItems: 'center',
    padding: '13px 14px',
    borderBottom: '1px solid rgba(195, 171, 140, 0.16)',
    background: rank <= 3 ? 'rgba(214, 164, 80, 0.07)' : 'transparent',
  }
}

const boardStyle = {
  borderRadius: 14,
  border: '1px solid var(--hairline-cold)',
  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(22, 14, 17, 0.92))',
  overflow: 'hidden',
}

const avatarStyle = {
  width: 42,
  height: 42,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(94, 138, 166, 0.45)',
  background: 'rgba(94, 138, 166, 0.12)',
  fontSize: 21,
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

const refreshButtonStyle = {
  all: 'unset',
  cursor: 'pointer',
  color: 'var(--gold)',
  fontFamily: 'var(--font-ui)',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}
