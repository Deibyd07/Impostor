import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { sfx } from '../../utils/sfx.js'

const modes = [
  {
    id: '01',
    icon: '🎭',
    title: 'Clásico',
    desc: 'Un impostor sin palabra. Solo memoria, nervios y actuación.',
    tone: 'red',
  },
  {
    id: '02',
    icon: '🔍',
    title: 'Con pista',
    desc: 'El impostor recibe una pista y puede mezclarse mejor.',
    tone: 'gold',
  },
  {
    id: '03',
    icon: '👁',
    title: 'Ciego',
    desc: 'El impostor cree ser ciudadano. La mesa se rompe sola.',
    tone: 'blue',
  },
]

const caseSteps = [
  'Reparte palabras secretas.',
  'Hablen por turnos sin decir la palabra.',
  'Detecten contradicciones.',
  'Voten antes de que el impostor escape.',
]

const releaseNotes = [
  'Voz online mas estable.',
  'Icono cuando alguien habla.',
  'Complices visibles para impostores.',
]

export default function Home() {
  const navigate = useNavigate()
  const hasSavedGame = useGameStore(s => s.hasSavedGame())
  const endSession = useGameStore(s => s.endSession)

  const onNew = () => { sfx.unlock(); endSession(); navigate('/setup') }
  const onResume = () => { sfx.unlock(); navigate('/game') }
  const onHow = () => navigate('/how')
  const onPatch = () => navigate('/patch-1-2-1')
  const onProfile = () => navigate('/profile')
  const onHost = () => { sfx.unlock(); navigate('/online/host') }
  const onJoin = () => { sfx.unlock(); navigate('/online/join') }

  const leftPanel = (
    <div className="case-rail case-rail--modes">
      <div className="case-rail__stamp">Archivo de modos</div>
      <div className="case-rail__stack">
        {modes.map(mode => (
          <article className={`case-mode-card case-mode-card--${mode.tone}`} key={mode.title}>
            <div className="case-mode-card__index">{mode.id}</div>
            <div className="case-mode-card__body">
              <div className="case-mode-card__title">
                <span>{mode.icon}</span>
                {mode.title}
              </div>
              <p>{mode.desc}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="case-rail__note">3-12 jugadores · Detective opcional · Local u online</div>
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
        <div className="case-evidence-card__label">Parche 1.2.1</div>
        <strong>Voz y complices</strong>
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
          <div className="case-file__clip" />
          <div className="case-file__stamp">Caso abierto</div>
          <div className="case-file__number">IM-09</div>
          <h1 id="home-title" className="case-file__title">El Impostor</h1>
          <p className="case-file__subtitle">Una palabra. Una mentira. Toda la mesa bajo sospecha.</p>

          <div className="case-file__thread" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>

          <div className="case-actions" aria-label="Acciones principales">
            <button className="case-action case-action--primary" onClick={onNew}>
              <span>Abrir caso</span>
              <strong>Nueva partida</strong>
            </button>

            {hasSavedGame && (
              <button className="case-action" onClick={onResume}>
                <span>Expediente activo</span>
                <strong>Reanudar</strong>
              </button>
            )}

            <button className="case-action" onClick={onProfile}>
              <span>Historial</span>
              <strong>Perfil de jugadores</strong>
            </button>
          </div>
        </section>

        <section className="case-online-card" aria-label="Modo online">
          <div>
            <span className="case-online-card__signal" />
            <strong>Sala privada</strong>
            <p>Invita a tu grupo y deja que el anfitrión controle el expediente.</p>
          </div>
          <div className="case-online-card__actions">
            <button onClick={onHost}>Crear sala</button>
            <button onClick={onJoin}>Unirme con código</button>
          </div>
        </section>

        <section className="case-menu-links" aria-label="Información del juego">
          <button className="case-how-link" onClick={onHow}>Cómo jugar</button>
          <button className="case-patch-link" onClick={onPatch}>
            <span>Novedades</span>
            <strong>Version 1.2.1</strong>
          </button>
        </section>

        <div className="case-version">v1.2.1 - voz estable y complices</div>
      </main>
    </PhoneScreen>
  )
}
