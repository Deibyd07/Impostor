import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
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
    title: 'Línea Privada',
    desc: 'Minijuegos por rondas: llamadas privadas, pactos y traiciones.',
    tone: 'blue',
    icon: 'tokens',
  },
]

const caseSteps = [
  'Elige el juego de misterio.',
  'Recibe información privada.',
  'Cruza versiones por voz.',
  'Vota cuando aparezca la contradicción.',
]

const releaseNotes = [
  'Avatares ilustrados para los perfiles.',
  'Nueva musica y efectos de mesa.',
  'Animaciones mas dramaticas en partida.',
]

/* entrada en cascada: cada pieza cae sobre la mesa con su propio retraso */
const drop = (reduce, delay = 0, fromY = 22) => reduce
  ? {}
  : {
      initial: { opacity: 0, y: fromY },
      animate: { opacity: 1, y: 0 },
      transition: { type: 'spring', stiffness: 210, damping: 22, mass: 0.85, delay },
    }

const slide = (reduce, fromX, delay = 0) => reduce
  ? {}
  : {
      initial: { opacity: 0, x: fromX },
      animate: { opacity: 1, x: 0 },
      transition: { type: 'spring', stiffness: 170, damping: 24, delay },
    }

export default function Home() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const hasSavedGame = useGameStore(s => s.hasSavedGame())
  const endSession = useGameStore(s => s.endSession)

  const onNew = () => { sfx.unlock(); sfx.uiTap(); endSession(); navigate('/setup') }
  const onResume = () => { sfx.unlock(); sfx.uiTap(); navigate('/game') }
  const onHow = () => { sfx.uiTap(); navigate('/how') }
  const onPatch = () => { sfx.uiTap(); navigate('/patch-0-4-0') }
  const onProfile = () => { sfx.uiTap(); navigate('/profile') }
  const onRanking = () => { sfx.uiTap(); navigate('/ranking') }
  const onHost = () => { sfx.unlock(); sfx.uiTap(); navigate('/online/host') }
  const onJoin = () => { sfx.unlock(); sfx.uiTap(); navigate('/online/join') }

  /* brillo cálido que persigue al cursor sobre la mesa */
  const glowX = useMotionValue(-600)
  const glowY = useMotionValue(-600)
  const springX = useSpring(glowX, { stiffness: 55, damping: 16, mass: 0.6 })
  const springY = useSpring(glowY, { stiffness: 55, damping: 16, mass: 0.6 })
  const trackGlow = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    glowX.set(event.clientX - rect.left - 190)
    glowY.set(event.clientY - rect.top - 190)
  }

  const leftPanel = (
    <motion.div style={{ height: '100%' }} {...slide(reduce, -30, 0.42)}>
      <div className="case-rail case-rail--modes">
        <div className="case-rail__stamp">Juegos de misterio</div>
        <div className="case-rail__stack">
          {games.map((game, index) => (
            <motion.article
              className={`case-mode-card case-mode-card--${game.tone}`}
              key={game.title}
              {...drop(reduce, 0.56 + index * 0.12, 16)}
            >
              <div className="case-mode-card__index">{game.id}</div>
              <div className="case-mode-card__body">
                <div className="case-mode-card__title">
                  <GameIcon name={game.icon} size={22} />
                  {game.title}
                </div>
                <p>{game.desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="case-rail__note">3-12 jugadores - palabras, llamadas y sospechas online</div>
      </div>
    </motion.div>
  )

  const rightPanel = (
    <motion.div style={{ height: '100%' }} {...slide(reduce, 30, 0.5)}>
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
          <div className="case-evidence-card__label">Alpha 0.4.0</div>
          <strong>Avatares, sonidos y drama</strong>
          <p>Consulta las mejoras de esta version y el historial de parches.</p>
          <ul className="case-release-list">
            {releaseNotes.map(note => <li key={note}>{note}</li>)}
          </ul>
        </button>
      </div>
    </motion.div>
  )

  return (
    <PhoneScreen
      className="evidence-home-screen"
      padTop={false}
      padBottom={false}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    >
      <main className="evidence-home" onMouseMove={reduce ? undefined : trackGlow}>
        {!reduce && (
          <motion.div
            className="home-glow"
            aria-hidden="true"
            style={{ x: springX, y: springY }}
          />
        )}

        <motion.div {...drop(reduce, 0.08, 30)}>
          <section className="case-file" aria-labelledby="home-title">
            <div className="case-file__props" aria-hidden="true">
              <GameIcon name="cardsStack" size={42} className="case-file__prop case-file__prop--cards" />
              <GameIcon name="token" size={30} className="case-file__prop case-file__prop--token" />
              <GameIcon name="skull" size={36} className="case-file__prop case-file__prop--skull" />
            </div>
            <div className="case-file__clip" />
            {reduce ? (
              <div className="case-file__stamp">Mesa abierta</div>
            ) : (
              <motion.div
                className="case-file__stamp"
                initial={{ opacity: 0, scale: 2.1, rotate: -6 }}
                animate={{ opacity: 1, scale: [2.1, 0.9, 1], rotate: [-6, 8.5, 7] }}
                transition={{ duration: 0.38, delay: 0.62, times: [0, 0.62, 1], ease: 'easeIn' }}
              >
                Mesa abierta
              </motion.div>
            )}
            <div className="case-file__number">Caso nº MS-01 · Distrito Centro</div>
            <h1 id="home-title" className="case-file__title">Mesa de Misterio</h1>
            <p className="case-file__subtitle">Elige entre juegos sociales de sospecha, palabras secretas y llamadas privadas.</p>

            <div className="case-file__thread" aria-hidden="true">
              {reduce ? (
                <>
                  <span />
                  <i />
                  <span />
                </>
              ) : (
                <>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: [0, 1.35, 1] }}
                    transition={{ duration: 0.26, delay: 0.78 }}
                  />
                  <motion.i
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: 'left center', y: 1 }}
                    transition={{ duration: 0.5, delay: 0.92, ease: 'easeInOut' }}
                  />
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: [0, 1.35, 1] }}
                    transition={{ duration: 0.26, delay: 1.36 }}
                  />
                </>
              )}
            </div>

            <div className="case-actions" aria-label="Acciones principales">
              <motion.div {...drop(reduce, 0.3, 16)} style={{ display: 'grid', minWidth: 0 }}>
                <button className="case-action case-action--primary" onClick={onNew}>
                  <GameIcon name="cardTarget" size={25} className="case-action__icon" />
                  <span>El Impostor local</span>
                  <strong>Nueva partida</strong>
                </button>
              </motion.div>

              {hasSavedGame && (
                <motion.div {...drop(reduce, 0.38, 16)} style={{ display: 'grid', minWidth: 0 }}>
                  <button className="case-action" onClick={onResume}>
                    <GameIcon name="cardsStack" size={24} className="case-action__icon" />
                    <span>Expediente activo</span>
                    <strong>Reanudar</strong>
                  </button>
                </motion.div>
              )}

              <motion.div {...drop(reduce, 0.44, 16)} style={{ display: 'grid', minWidth: 0 }}>
                <button className="case-action" onClick={onProfile}>
                  <GameIcon name="character" size={24} className="case-action__icon" />
                  <span>Identidad</span>
                  <strong>Mis perfiles</strong>
                </button>
              </motion.div>

              <motion.div {...drop(reduce, 0.5, 16)} style={{ display: 'grid', minWidth: 0 }}>
                <button className="case-action" onClick={onRanking}>
                  <GameIcon name="award" size={24} className="case-action__icon" />
                  <span>Global</span>
                  <strong>Ranking</strong>
                </button>
              </motion.div>
            </div>
          </section>
        </motion.div>

        <motion.div {...drop(reduce, 0.6, 26)}>
          <section className="case-online-card" aria-label="Sala online">
            <div>
              <span className="case-online-card__signal" />
              <GameIcon name="tokens" size={22} className="case-online-card__icon" />
              <strong>Sala privada online</strong>
              <p>Crea una mesa y elige si jugar El Impostor o Línea Privada antes de repartir cartas.</p>
            </div>
            <div className="case-online-card__actions">
              <button onClick={onHost}>Crear sala</button>
              <button onClick={onJoin}>Unirme con codigo</button>
            </div>
          </section>
        </motion.div>

        <motion.div {...drop(reduce, 0.74, 18)}>
          <section className="case-menu-links" aria-label="Informacion del juego">
            <button className="case-how-link" onClick={onHow}>Cómo jugar</button>
            <button className="case-patch-link" onClick={onPatch}>
              <span>Novedades</span>
              <strong>Alpha 0.4.0</strong>
            </button>
          </section>
        </motion.div>

        <motion.div {...drop(reduce, 0.84, 10)}>
          <div className="case-version">v0.4.0 alpha - juegos de misterio social</div>
          <p className="case-asset-credit">
            Musica de fondo: <a href="https://pixabay.com/music/search/mystery%20quirky/" target="_blank" rel="noreferrer">Mystery Quirky</a> por <a href="https://pixabay.com/users/leberch-42823964/" target="_blank" rel="noreferrer">leberch</a>, bajo <a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noreferrer">licencia de contenido de Pixabay</a>.
            <br />
            Avatares diseñados por <a href="https://www.freepik.com" target="_blank" rel="noreferrer">Kubanek / Freepik</a>.
          </p>
        </motion.div>
      </main>
    </PhoneScreen>
  )
}
