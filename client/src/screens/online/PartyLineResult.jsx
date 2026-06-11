import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import PlayerAvatar from '../../components/PlayerAvatar.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function PartyLineResult() {
  const navigate = useNavigate()
  const phase = useOnlineStore(s => s.phase)
  const isHost = useOnlineStore(s => s.isHost)
  const result = useOnlineStore(s => s.partyLineResult)
  const nextPartyLineRound = useOnlineStore(s => s.nextPartyLineRound)

  useEffect(() => {
    if (phase === 'partyIntro') navigate('/online/party-intro')
    if (phase === 'partyRound') navigate('/online/party')
    if (phase === 'ended') navigate('/online/end')
  }, [phase, navigate])

  if (!result) {
    return (
      <PhoneScreen className="online-voice-screen partyline-screen">
        <div style={{ padding: 40, color: 'var(--text-2)', textAlign: 'center' }}>
          Esperando resultado de la llamada...
        </div>
      </PhoneScreen>
    )
  }

  const remaining = Math.max(0, result.totalRounds - result.round)

  return (
    <PhoneScreen
      className="online-voice-screen partyline-screen partyline-result-screen"
      footer={
        isHost ? (
          <button className="btn btn-primary" onClick={nextPartyLineRound}>
            {remaining > 0 ? 'Siguiente llamada' : 'Ver final'}
          </button>
        ) : (
          <div className="discussion-action discussion-action--waiting">
            Esperando al anfitrion...
          </div>
        )
      }
    >
      <main className="partyline-result">
        <header className="partyline-round__hero partyline-result__hero">
          <span className="stamp stamp--lg stamp--tilt-r partyline-result__stamp">Llamada cerrada</span>
          <div>
            <span className="t-eyebrow">Resultado ronda {result.round}/{result.totalRounds}</span>
            <h1>{result.title || result.game?.title}</h1>
            <p>{result.summary}</p>
          </div>
          <Badge color="var(--gold)" dot>{remaining} restantes</Badge>
        </header>

        <section className="partyline-result-grid">
          <article className="partyline-result-panel">
            <h2 className="partyline-result-panel__title">Revelación</h2>
            <div className="partyline-result-list">
              {(result.details || []).map(item => (
                <div key={`${item.playerId}-${item.name}-${item.label}`}>
                  <PlayerAvatar avatar={item.avatar} name={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.label}</small>
                    <p>{item.value}</p>
                  </div>
                  {Number.isFinite(item.votes) && <b>{item.votes}</b>}
                  {Number.isFinite(item.correct) && <b>{item.correct}/2</b>}
                </div>
              ))}
            </div>
          </article>

          <article className="partyline-result-panel">
            <h2 className="partyline-result-panel__title">Puntos de ronda</h2>
            <div className="partyline-result-list">
              {(result.points || []).map(item => (
                <div key={item.playerId} className={item.points > 0 ? 'is-positive' : item.points < 0 ? 'is-negative' : ''}>
                  <PlayerAvatar avatar={item.avatar} name={item.name} />
                  <strong>{item.name}</strong>
                  <b>{item.points > 0 ? `+${item.points}` : item.points}</b>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="partyline-result-panel">
          <h2 className="partyline-result-panel__title">Ranking de la sala</h2>
          <div className="partyline-result-list partyline-score-list">
            {(result.scoreboard || []).map(item => (
              <div key={item.playerId} className={item.rank === 1 ? 'is-positive' : ''}>
                <span>{item.rank}</span>
                <strong>{item.name}</strong>
                <b>{item.totalPoints}</b>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PhoneScreen>
  )
}
