import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'

const flow = [
  {
    title: 'Configura la mesa',
    body: 'Elige jugadores, categoría, modo, número de impostores y si habrá Detective.',
  },
  {
    title: 'Revela tu rol',
    body: 'Cada jugador ve su carta en secreto. Los ciudadanos reciben la palabra real.',
  },
  {
    title: 'Discute sin decir la palabra',
    body: 'Usen turnos, pistas sutiles y presión social para detectar contradicciones.',
  },
  {
    title: 'Voten y revelen',
    body: 'La mesa elimina a un sospechoso y el juego revela si era impostor o ciudadano.',
  },
]

const modes = [
  {
    title: 'Clásico',
    body: 'El impostor no conoce la palabra. Debe escuchar, copiar el tono de la mesa y sobrevivir.',
    accent: 'red',
  },
  {
    title: 'Con pista',
    body: 'El impostor recibe una pista controlada para improvisar sin quedar perdido desde el inicio.',
    accent: 'gold',
  },
  {
    title: 'Ciego',
    body: 'El impostor cree ser ciudadano y recibe una palabra falsa relacionada. Nadie sabe que está mintiendo.',
    accent: 'blue',
  },
]

const rules = [
  'Los ciudadanos ganan si eliminan a todos los impostores.',
  'Los impostores ganan si igualan o superan en número a los ciudadanos.',
  'En modo clásico, el impostor puede intentar adivinar la palabra antes de caer.',
  'No repitas la palabra ni variantes demasiado obvias durante la discusión.',
]

const newTools = [
  'La mesa ahora tiene una identidad visual mas cercana a un juego de expediente.',
  'Los modos, acciones y paneles principales usan iconos mas faciles de reconocer.',
  'Las cartas de rol y la votacion tienen senales visuales mas dramaticas.',
  'El Detective puede ser ciudadano o impostor; no aumenta el total de impostores.',
  'Durante el interrogatorio, Detective e interrogado tienen un canal de voz privado.',
]

const tips = [
  'Ciudadano: da detalles reales, pero no regales la palabra.',
  'Impostor: escucha primero y reutiliza el vocabulario de la mesa.',
  'Detective: interroga a quien ya parezca raro, no al azar.',
  'En llamada: respeten los turnos y usen el chat como apoyo, no como reemplazo.',
]

export default function HowToPlay() {
  const navigate = useNavigate()

  const leftPanel = (
    <GuideRail
      eyebrow="Flujo recomendado"
      title="De apertura a votación"
      items={flow.map((item, index) => ({
        label: String(index + 1).padStart(2, '0'),
        title: item.title,
        body: item.body,
      }))}
    />
  )

  const rightPanel = (
    <GuideRail
      eyebrow="Alpha 0.4.0"
      title="Herramientas nuevas"
      items={newTools.map((item, index) => ({
        label: `0.${index + 1}`,
        title: item,
      }))}
    />
  )

  return (
    <PhoneScreen
      className="guide-screen"
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footer={<button className="btn btn-primary" onClick={() => navigate('/setup')}>Abrir caso</button>}
    >
      <div className="guide-page">
        <header className="guide-topbar">
          <button onClick={() => navigate(-1)}>Volver</button>
          <span>Manual de campo</span>
          <button onClick={() => navigate('/patch-0-4-0')}>Alpha 0.4.0</button>
        </header>

        <section className="guide-hero" aria-labelledby="how-title">
          <div className="guide-hero__case">IM-Manual</div>
          <h1 id="how-title">Cómo se juega</h1>
          <p>
            El Impostor enfrenta a una mesa de ciudadanos contra jugadores que deben fingir
            conocer una palabra secreta. La partida se gana con atención, actuación y voto frío.
          </p>
        </section>

        <GuideSection title="Objetivo" accent="gold">
          <p>
            Los ciudadanos conocen la palabra real y deben descubrir a quienes no la tienen.
            Los impostores deben mezclarse en la conversación, sobrevivir a las votaciones
            y, cuando aplique, adivinar la palabra antes de ser eliminados.
          </p>
        </GuideSection>

        <GuideSection title="Modos" accent="red">
          <div className="guide-card-grid">
            {modes.map(mode => (
              <article className={`guide-card guide-card--${mode.accent}`} key={mode.title}>
                <strong>{mode.title}</strong>
                <p>{mode.body}</p>
              </article>
            ))}
          </div>
        </GuideSection>

        <GuideSection title="Reglas de victoria" accent="gold">
          <ul className="guide-list">
            {rules.map(rule => <li key={rule}>{rule}</li>)}
          </ul>
        </GuideSection>

        <GuideSection title="Online y Detective" accent="gold">
          <p>
            En online puedes crear una sala privada, compartir código o enlace, usar chat
            durante la discusión y recuperar mejor la partida cuando alguien recarga o vuelve
            a entrar.
          </p>
          <p>
            Si activan Detective, ese rol puede abrir un interrogatorio corto y dramático.
            En esta versión el Detective puede ser impostor: gana con los impostores, pero
            conserva la habilidad para presionar a otro jugador.
          </p>
          <p>
            Si usan voz online, el interrogatorio separa temporalmente la llamada: Detective
            e interrogado hablan en privado mientras el resto de la mesa conserva su propio canal.
          </p>
        </GuideSection>

        <GuideSection title="Consejos rápidos" accent="red">
          <ul className="guide-list">
            {tips.map(tip => <li key={tip}>{tip}</li>)}
          </ul>
        </GuideSection>
      </div>
    </PhoneScreen>
  )
}

function GuideSection({ title, accent = 'gold', children }) {
  return (
    <section className="guide-section">
      <SectionHeader accent={accent}>{title}</SectionHeader>
      <div className="guide-section__body">{children}</div>
    </section>
  )
}

function GuideRail({ eyebrow, title, items }) {
  return (
    <div className="guide-rail">
      <div className="guide-rail__eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <div className="guide-rail__items">
        {items.map(item => (
          <article className="guide-rail__item" key={`${item.label}-${item.title}`}>
            <span>{item.label}</span>
            <div>
              <strong>{item.title}</strong>
              {item.body && <p>{item.body}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
