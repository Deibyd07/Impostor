import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'

const highlights = [
  {
    code: 'IM-32',
    title: 'Detective-impostor',
    body: 'El Detective ahora puede caer en el equipo impostor, con carta propia y habilidad para desviar la mesa desde el interrogatorio.',
  },
  {
    code: 'IM-33',
    title: 'Voz online por sala',
    body: 'Chat de voz integrado con microfono, volumen general y volumen individual por jugador desde lobby y discusion.',
  },
  {
    code: 'IM-34',
    title: 'Canales de interrogatorio',
    body: 'Cuando el Detective interroga, detective e interrogado pasan a un canal privado y el resto de la mesa habla aparte.',
  },
]

const sections = [
  {
    title: 'Juego y roles',
    items: [
      'El Detective puede ser ciudadano o impostor sin sumar impostores extra.',
      'La probabilidad del Detective impostor es impostores divididos entre jugadores.',
      'Carta unica para Detective-impostor con pista privada o palabra coartada segun el modo.',
      'Victorias, eliminaciones y estadisticas reconocen al Detective-impostor como equipo impostor.',
    ],
  },
  {
    title: 'Online',
    items: [
      'Chat de voz WebRTC en lobby y discusion.',
      'Controles de microfono, salida de voz y volumen por cada jugador.',
      'Durante interrogatorio hay canal privado para Detective e interrogado.',
      'El resto de la mesa mantiene una voz secundaria sin escuchar el interrogatorio.',
    ],
  },
  {
    title: 'Experiencia',
    items: [
      'Panel de voz integrado al estilo de expediente del juego.',
      'Indicadores de canal privado y mesa secundaria durante interrogatorio.',
      'Sonido de revelacion compatible con el nuevo rol hibrido.',
      'Notas del parche actualizadas desde el menu principal.',
    ],
  },
]

const testFlow = [
  'Crea una sala online con al menos tres jugadores y activa Detective.',
  'Entra al panel de voz desde lobby y ajusta el volumen de cada jugador.',
  'Inicia partida hasta discusion y prueba un interrogatorio.',
  'Verifica que Detective e interrogado se escuchan aparte y la mesa conserva su propio canal.',
]

export default function PatchNotes() {
  const navigate = useNavigate()

  const leftPanel = (
    <PatchRail
      eyebrow="Expediente"
      title="Versión 1.2"
      body="Parche centrado en voz online, canales privados de interrogatorio y la nueva identidad Detective-impostor."
    />
  )

  const rightPanel = (
    <div className="patch-rail">
      <div className="patch-rail__eyebrow">Prueba rápida</div>
      <h2>Flujo sugerido</h2>
      <ol className="patch-test-list">
        {testFlow.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )

  return (
    <PhoneScreen
      className="patch-screen"
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footer={<button className="btn btn-primary" onClick={() => navigate('/setup')}>Probar parche</button>}
    >
      <div className="patch-page">
        <header className="guide-topbar">
          <button onClick={() => navigate('/')}>Inicio</button>
          <span>Novedades</span>
          <button onClick={() => navigate('/how')}>Cómo jugar</button>
        </header>

        <section className="patch-hero" aria-labelledby="patch-title">
          <div className="patch-hero__tag">Parche 1.2</div>
          <h1 id="patch-title">Doble identidad en la mesa</h1>
          <p>
            Esta versión integra voz online real para la sala y abre una variante mas peligrosa:
            el Detective puede ser impostor y usar el interrogatorio para dirigir la sospecha.
          </p>
        </section>

        <section className="patch-highlights" aria-label="Cambios principales">
          {highlights.map(item => (
            <article className="patch-highlight-card" key={item.code}>
              <span>{item.code}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        {sections.map(section => (
          <section className="patch-section" key={section.title}>
            <SectionHeader>{section.title}</SectionHeader>
            <ul className="patch-feature-list">
              {section.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </PhoneScreen>
  )
}

function PatchRail({ eyebrow, title, body }) {
  return (
    <div className="patch-rail patch-rail--release">
      <div className="patch-rail__eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="patch-rail__stamp">Mesa de evidencias</div>
    </div>
  )
}
