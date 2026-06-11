import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import { OnlineVoiceMobilePanel, OnlineVoicePanel } from '../../components/OnlineVoicePanel.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function AlibiRoundResult() {
  const navigate = useNavigate()
  const phase = useOnlineStore(s => s.phase)
  const isHost = useOnlineStore(s => s.isHost)
  const result = useOnlineStore(s => s.alibiRoundResult)
  const nextAlibiRound = useOnlineStore(s => s.nextAlibiRound)

  useEffect(() => {
    if (phase === 'caseIntro') navigate('/online/alibi-case')
    if (phase === 'reveal') navigate('/online/card')
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'ended') navigate('/online/end')
  }, [phase, navigate])

  if (!result) {
    return (
      <PhoneScreen className="online-voice-screen alibi-result-screen" rightPanel={<OnlineVoicePanel />}>
        <div style={{ padding: 40, color: 'var(--text-2)', textAlign: 'center' }}>
          Esperando resultado de la ronda...
        </div>
        <OnlineVoiceMobilePanel />
      </PhoneScreen>
    )
  }

  const remaining = Math.max(0, result.totalRounds - result.round)

  return (
    <PhoneScreen
      className="online-voice-screen alibi-result-screen"
      rightPanel={<OnlineVoicePanel />}
      footer={
        isHost ? (
          <button className="btn btn-primary" onClick={nextAlibiRound}>
            {remaining > 0 ? 'Siguiente coartada' : 'Ver final'}
          </button>
        ) : (
          <div className="discussion-action discussion-action--waiting">
            Esperando al anfitrion...
          </div>
        )
      }
    >
      <main className="alibi-result">
        <header className="alibi-result__hero">
          <span
            className={`stamp stamp--xl ${result.detected ? 'stamp--green' : ''}`}
            style={{ position: 'absolute', top: 18, right: 16, zIndex: 4 }}
            aria-hidden="true"
          >
            {result.detected ? 'Resuelto' : 'Impune'}
          </span>
          <span className="t-eyebrow">Resultado ronda {result.round}/{result.totalRounds}</span>
          <h1>{result.detected ? 'La mesa rompió la coartada' : 'La mentira sobrevivió'}</h1>
          <p>{result.caseTitle}</p>
          <Badge color={result.detected ? 'var(--victory)' : 'var(--impostor)'} dot warn={!result.detected}>
            {result.detected ? 'Mentiroso descubierto' : 'Coartada intacta'}
          </Badge>
        </header>

        <section className="alibi-result__liar">
          <span>{result.detected ? 'Acusacion correcta' : 'Acusacion fallida'}</span>
          <strong>{result.liar?.avatar || '?'} {result.liar?.name || 'Sin jugador'}</strong>
          <p>
            {result.detected
              ? `${result.detective?.name || 'El Detective'} descubrio la coartada falsa.`
              : `${result.detective?.name || 'El Detective'} acuso a otro sospechoso y la mentira sobrevivio.`}
          </p>
          {result.liar?.claimedLocation && result.liar?.realLocation && (
            <p>Declaro estar en {result.liar.claimedLocation}, pero realmente estuvo en {result.liar.realLocation}.</p>
          )}
        </section>

        <section className="alibi-result__grid">
          <article>
            <SectionHeader>Acusacion del detective</SectionHeader>
            <div className="alibi-result-list">
              {result.voteCounts.map(item => (
                <div key={item.playerId} className={item.isLiar ? 'is-liar' : ''}>
                  <span>{item.avatar || item.name.charAt(0).toUpperCase()}</span>
                  <strong>{item.name}</strong>
                  <b>{item.votes}</b>
                </div>
              ))}
            </div>
          </article>

          <article>
            <SectionHeader>Puntos de ronda</SectionHeader>
            <div className="alibi-result-list">
              {result.points.map(item => (
                <div key={item.playerId} className={item.isLiar ? 'is-liar' : item.votedCorrectly ? 'is-correct' : ''}>
                  <span>{item.avatar || item.name.charAt(0).toUpperCase()}</span>
                  <strong>{item.name}</strong>
                  <b>+{item.points}</b>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="alibi-scoreboard">
          <SectionHeader>Ranking de sala</SectionHeader>
          <div className="alibi-result-list">
            {result.scoreboard.map(item => (
              <div key={item.playerId}>
                <span>{item.rank}</span>
                <strong>{item.name}</strong>
                <b>{item.totalPoints}</b>
              </div>
            ))}
          </div>
        </section>
      </main>
      <OnlineVoiceMobilePanel />
    </PhoneScreen>
  )
}
