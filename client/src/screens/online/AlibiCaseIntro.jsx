import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import AlibiMap from '../../components/AlibiMap.jsx'
import { OnlineVoiceMobilePanel, OnlineVoicePanel } from '../../components/OnlineVoicePanel.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function AlibiCaseIntro() {
  const navigate = useNavigate()
  const phase = useOnlineStore(s => s.phase)
  const isHost = useOnlineStore(s => s.isHost)
  const alibiCase = useOnlineStore(s => s.alibiCase)
  const players = useOnlineStore(s => s.players)
  const continueAlibiIntro = useOnlineStore(s => s.continueAlibiIntro)

  useEffect(() => {
    if (phase === 'reveal') navigate('/online/card')
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'roundResult') navigate('/online/alibi-result')
    if (phase === 'ended') navigate('/online/end')
  }, [phase, navigate])

  const story = Array.isArray(alibiCase?.story) ? alibiCase.story : []
  const evidence = Array.isArray(alibiCase?.publicEvidence) ? alibiCase.publicEvidence : []
  const howToPlay = Array.isArray(alibiCase?.howToPlay) ? alibiCase.howToPlay : []
  const questions = Array.isArray(alibiCase?.tableQuestions) ? alibiCase.tableQuestions : []
  const victim = alibiCase?.victim
  const incident = alibiCase?.incident
  const activePlayers = players.filter(player => !player.disconnected)

  return (
    <PhoneScreen
      className="online-voice-screen alibi-case-screen"
      rightPanel={<OnlineVoicePanel />}
      footer={
        isHost ? (
          <button className="btn btn-primary" onClick={continueAlibiIntro}>
            Repartir coartadas
          </button>
        ) : (
          <div className="discussion-action discussion-action--waiting">
            Esperando que el anfitrion reparta las coartadas...
          </div>
        )
      }
    >
      <main className="alibi-case-intro" aria-live="polite">
        <section className="alibi-case-hero">
          <div className="alibi-case-hero__copy">
            <span className="t-eyebrow">{alibiCase?.subtitle || 'Expediente abierto'}</span>
            <h1>{alibiCase?.title || 'Caso sin nombre'}</h1>
            <p>{alibiCase?.premise || alibiCase?.brief || 'La mesa debe reconstruir una historia antes de acusar.'}</p>
            <div className="alibi-case-hero__badges">
              <Badge color="var(--gold)" dot>Ronda {alibiCase?.round || 1}/{alibiCase?.totalRounds || 3}</Badge>
              {incident?.time && <Badge color="var(--impostor)" dot warn>{incident.time}</Badge>}
              {incident?.place && <Badge color="var(--citizen)" dot>{incident.place}</Badge>}
            </div>
          </div>

          <aside className="alibi-victim-card">
            <span>Victima</span>
            <strong>{victim?.name || 'Sin identificar'}</strong>
            <p>{victim?.detail || victim?.role || 'Testigo clave'}</p>
            {victim?.lastSeen && <small>Ultima vez: {victim.lastSeen}</small>}
          </aside>
        </section>

        <section className="alibi-case-objective">
          <span className="t-eyebrow">Regla de la ronda</span>
          <strong>{alibiCase?.objective || 'Encuentren la coartada falsa.'}</strong>
          <p>{alibiCase?.roundPrompt || 'Pregunten por rutas, sonidos y detalles que no se puedan improvisar facil.'}</p>
        </section>

        <section className="alibi-case-grid">
          <article className="alibi-story-panel">
            <SectionHeader>Historia publica</SectionHeader>
            <div className="alibi-story-timeline">
              {(story.length ? story : [alibiCase?.brief]).filter(Boolean).map((item, index) => (
                <div key={`${item}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="alibi-how-panel">
            <SectionHeader>Como se juega</SectionHeader>
            <ol>
              {(howToPlay.length ? howToPlay : [
                'Lean el caso y observen el mapa.',
                'Memoricen su coartada privada.',
                'Discutan en llamada y voten la coartada falsa.',
              ]).map(item => <li key={item}>{item}</li>)}
            </ol>
          </article>
        </section>

        <section className="alibi-case-grid alibi-case-grid--evidence">
          <article className="alibi-evidence-panel">
            <SectionHeader right={incident?.cause}>Evidencia inicial</SectionHeader>
            <ul>
              {evidence.map(item => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="alibi-questions-panel">
            <SectionHeader>Preguntas utiles</SectionHeader>
            <ul>
              {(questions.length ? questions : [
                'Que podias ver desde tu zona?',
                'Que escuchaste durante el apagon?',
                'Quien pudo moverse mas rapido?',
              ]).map(item => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </section>

        <AlibiMap map={alibiCase?.map} />

        <section className="alibi-case-briefing">
          <div>
            <span className="t-eyebrow">Objetivo de la mesa</span>
            <strong>Hablen, crucen pistas y voten una sola coartada.</strong>
            <p>La partida se vuelve entretenida cuando cada jugador defiende su version con calma y los demas presionan con preguntas concretas.</p>
          </div>
          <div className="alibi-case-briefing__players">
            <span>{activePlayers.length}</span>
            <small>sospechosos dentro de la estacion</small>
          </div>
        </section>
      </main>
      <OnlineVoiceMobilePanel />
    </PhoneScreen>
  )
}
