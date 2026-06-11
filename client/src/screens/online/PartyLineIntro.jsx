import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function PartyLineIntro() {
  const navigate = useNavigate()
  const phase = useOnlineStore(s => s.phase)
  const isHost = useOnlineStore(s => s.isHost)
  const partyLine = useOnlineStore(s => s.partyLine)
  const players = useOnlineStore(s => s.players)
  const continuePartyLineIntro = useOnlineStore(s => s.continuePartyLineIntro)

  useEffect(() => {
    if (phase === 'partyRound') navigate('/online/party')
    if (phase === 'partyResult') navigate('/online/party-result')
    if (phase === 'ended') navigate('/online/end')
  }, [phase, navigate])

  const games = Array.isArray(partyLine?.games) ? partyLine.games : []

  return (
    <PhoneScreen
      className="online-voice-screen partyline-screen partyline-intro-screen"
      footer={
        isHost ? (
          <button className="btn btn-primary" onClick={continuePartyLineIntro}>
            Abrir primera llamada
          </button>
        ) : (
          <div className="discussion-action discussion-action--waiting">
            Esperando que el anfitrion abra la primera llamada...
          </div>
        )
      }
    >
      <main className="partyline-intro">
        <section className="partyline-hero">
          <div>
            <span className="t-eyebrow">Nuevo modo party</span>
            <h1>Linea Privada</h1>
            <p>
              Rondas cortas de llamadas, pactos y mentiras. Cada jugador recibe informacion privada,
              llama a otros jugadores y envia una decision secreta.
            </p>
            <div className="partyline-hero__badges">
              <Badge color="var(--gold)" dot>{partyLine?.totalRounds || 5} rondas</Badge>
              <Badge color="var(--citizen)" dot>{players.filter(player => !player.disconnected).length} jugadores</Badge>
            </div>
          </div>
          <aside className="partyline-switchboard" aria-hidden="true">
            <span className="partyline-switchboard__plate">Centralita</span>
            <div className="partyline-switchboard__jacks">
              {Array.from({ length: 9 }).map((_, index) => (
                <i key={index} className={index === 4 ? 'is-live' : ''} />
              ))}
            </div>
            <strong>EXT. 00</strong>
            <span className="partyline-switchboard__cord" />
          </aside>
        </section>

        <section className="partyline-rules">
          <SectionHeader>Como se juega</SectionHeader>
          <div className="partyline-rule-grid">
            <article>
              <span>01</span>
              <strong>Lee tu pista privada</strong>
              <p>No todos ven la misma informacion. Tu carta cambia segun el minijuego.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Llama y negocia</strong>
              <p>Elige a quien llamar, pacta en privado y cruza versiones antes de enviar tu accion.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Envia en secreto</strong>
              <p>Cuando todos deciden, la mesa revela puntos y pasa a la siguiente llamada.</p>
            </article>
          </div>
        </section>

        <section className="partyline-games">
          <SectionHeader right={`${games.length} activos`}>Minijuegos posibles</SectionHeader>
          <div className="partyline-game-grid">
            {games.map((game, index) => (
              <article key={game.id} className={`partyline-game-card partyline-game-card--${game.tone || 'gold'}`}>
                <i className="partyline-game-card__pin" aria-hidden="true" />
                <span>{String(index + 1).padStart(2, '0')} · {game.shortTitle || game.title}</span>
                <strong>{game.title}</strong>
                <p>{game.objective}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PhoneScreen>
  )
}
