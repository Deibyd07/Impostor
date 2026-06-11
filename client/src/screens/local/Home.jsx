import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import GameIcon from '../../components/GameIcon.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { sfx } from '../../utils/sfx.js'

const games = [
  {
    id: '01',
    title: 'El Impostor',
    desc: 'Palabras secretas, impostores y acusaciones en la mesa.',
    tone: 'red',
    icon: 'cardsSkull',
  },
  {
    id: '02',
    title: 'Coartada',
    desc: 'Casos por rondas: pistas privadas, versiones falsas y sospechas.',
    tone: 'gold',
    icon: 'cardTarget',
  },
]

const caseSteps = [
  'Elige el juego de misterio.',
  'Recibe información privada.',
  'Cruza versiones por voz.',
  'Vota cuando aparezca la contradicción.',
]

const releaseNotes = [
  'Coartada entra como juego independiente.',
  'Nueva identidad visual de tablero y expediente.',
  'Cartas de rol y votacion con mas presencia visual.',
]

export default function Home() {
  const navigate = useNavigate()
  const hasSavedGame = useGameStore(s => s.hasSavedGame())
  const endSession = useGameStore(s => s.endSession)

  const onNew = () => { sfx.unlock(); endSession(); navigate('/setup') }
  const onResume = () => { sfx.unlock(); navigate('/game') }
  const onHow = () => navigate('/how')
  const onPatch = () => navigate('/patch-0-2-2')
  const onProfile = () => navigate('/profile')
  const onRanking = () => navigate('/ranking')
  const onHost = () => { sfx.unlock(); navigate('/online/host') }
  const onJoin = () => { sfx.unlock(); navigate('/online/join') }

  const leftPanel = (
    <div className="case-rail case-rail--modes">
      <div className="case-rail__stamp">Juegos de misterio</div>
      <div className="case-rail__stack">
        {games.map(game => (
          <article className={`case-mode-card case-mode-card--${game.tone}`} key={game.title}>
            <div className="case-mode-card__index">{game.id}</div>
            <div className="case-mode-card__body">
              <div className="case-mode-card__title">
                <GameIcon name={game.icon} size={22} />
                {game.title}
              </div>
              <p>{game.desc}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="case-rail__note">3-12 jugadores - palabras, coartadas y sospechas online</div>
    </div>
  )

  const rightPanel = (
    <div className="case-rail case-rail--brief">
      <div className="case-rail__stamp">Procedimiento</div>
      <ol className="case-checklist">
        {caseSteps.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="case-evidence-card">
        <div className="case-evidence-card__label">Estado del caso</div>
        <strong>{hasSavedGame ? 'Partida en curso' : 'Sin expediente abierto'}</strong>
        <p>{hasSavedGame ? 'Puedes reanudar o abrir un caso nuevo.' : 'Prepara la mesa y reparte identidades.'}</p>
      </div>
      <button type="button" className="case-evidence-card case-release-link" onClick={onPatch}>
        <div className="case-evidence-card__label">Alpha 0.2.2</div>
        <strong>Mesa con identidad visual</strong>
        <p>Consulta las mejoras de esta version y el historial de parches.</p>
        <ul className="case-release-list">
          {releaseNotes.map(note => <li key={note}>{note}</li>)}
        </ul>
      </button>
    </div>
  )

  return (
    <PhoneScreen
      className="evidence-home-screen"
      padTop={false}
      padBottom={false}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    >
      <main className="evidence-home">
        <section className="case-file" aria-labelledby="home-title">
          <div className="case-file__props" aria-hidden="true">
            <GameIcon name="cardsStack" size={42} className="case-file__prop case-file__prop--cards" />
            <GameIcon name="token" size={30} className="case-file__prop case-file__prop--token" />
            <GameIcon name="skull" size={36} className="case-file__prop case-file__prop--skull" />
          </div>
          <div className="case-file__clip" />
          <div className="case-file__stamp">Mesa abierta</div>
          <div className="case-file__number">Caso nº MS-01 · Distrito Centro</div>
          <h1 id="home-title" className="case-file__title">Mesa de Misterio</h1>
          <p className="case-file__subtitle">Elige entre juegos sociales de sospecha, palabras secretas y coartadas falsas.</p>

          <div className="case-file__thread" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>

          <div className="case-actions" aria-label="Acciones principales">
            <button className="case-action case-action--primary" onClick={onNew}>
              <GameIcon name="cardTarget" size={25} className="case-action__icon" />
              <span>El Impostor local</span>
              <strong>Nueva partida</strong>
            </button>

            {hasSavedGame && (
              <button className="case-action" onClick={onResume}>
                <GameIcon name="cardsStack" size={24} className="case-action__icon" />
                <span>Expediente activo</span>
                <strong>Reanudar</strong>
              </button>
            )}

            <button className="case-action" onClick={onProfile}>
              <GameIcon name="character" size={24} className="case-action__icon" />
              <span>Identidad</span>
              <strong>Mis perfiles</strong>
            </button>

            <button className="case-action" onClick={onRanking}>
              <GameIcon name="award" size={24} className="case-action__icon" />
              <span>Global</span>
              <strong>Ranking</strong>
            </button>
          </div>
        </section>

        <section className="case-online-card" aria-label="Sala online">
          <div>
            <span className="case-online-card__signal" />
            <GameIcon name="tokens" size={22} className="case-online-card__icon" />
            <strong>Sala privada online</strong>
            <p>Crea una mesa y elige si jugar El Impostor o Coartada antes de repartir cartas.</p>
          </div>
          <div className="case-online-card__actions">
            <button onClick={onHost}>Crear sala</button>
            <button onClick={onJoin}>Unirme con codigo</button>
          </div>
        </section>

        <section className="case-menu-links" aria-label="Informacion del juego">
          <button className="case-how-link" onClick={onHow}>Cómo jugar</button>
          <button className="case-patch-link" onClick={onPatch}>
            <span>Novedades</span>
            <strong>Alpha 0.2.2</strong>
          </button>
        </section>

        <div className="case-version">v0.2.2 alpha - juegos de misterio social</div>
      </main>
    </PhoneScreen>
  )
}
