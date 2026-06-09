import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'

const highlights = [
  {
    code: 'IM-26',
    title: 'Detective con interrogatorio',
    body: 'Rol opcional que puede abrir una escena privada con un jugador mientras el resto de la mesa queda en silencio.',
  },
  {
    code: 'IM-24',
    title: 'Chat online de discusión',
    body: 'Mensajes en tiempo real con nombre y avatar, historial limitado y control de longitud para mantener la mesa limpia.',
  },
  {
    code: 'IM-31',
    title: 'Eliminación dramática',
    body: 'Nueva animación con partículas, sonido sincronizado y revelación clara del rol eliminado.',
  },
]

const sections = [
  {
    title: 'Juego y roles',
    items: [
      'Detective configurable desde Setup.',
      'Interrogatorio con aviso distinto para observadores.',
      'Modo Ciego reforzado con palabras relacionadas.',
      'Historial para evitar repetir palabras recientes en la sesión.',
    ],
  },
  {
    title: 'Online',
    items: [
      'Chat visible durante la fase de discusión.',
      'Transferencia automática de host si el anfitrión sale.',
      'Entrada de código más directa en sala privada.',
      'Feedback visual verde al copiar el enlace de invitación.',
    ],
  },
  {
    title: 'Experiencia',
    items: [
      'Splash screen inicial con animación de marca.',
      'Rediseño desktop del menú, lobby y partida.',
      'Controles globales de sonido y volumen.',
      'Avatares con emojis nativos y perfil local de jugadores.',
    ],
  },
]

const testFlow = [
  'Abre una partida local y confirma que el perfil suma estadísticas al terminar.',
  'Crea una sala online, copia el enlace y valida que el botón confirme el copiado.',
  'Activa Detective, inicia discusión y prueba un interrogatorio con otro jugador.',
  'Vota a un jugador y revisa la nueva escena de eliminación.',
]

export default function PatchNotes() {
  const navigate = useNavigate()

  const leftPanel = (
    <PatchRail
      eyebrow="Expediente"
      title="Versión 1.1"
      body="Parche centrado en hacer la mesa más expresiva: mejor audio, roles con presencia, chat, perfiles y una experiencia desktop más amplia."
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
          <div className="patch-hero__tag">Parche 1.1</div>
          <h1 id="patch-title">Nuevo caso abierto</h1>
          <p>
            Esta versión hace que cada partida tenga más identidad: roles más teatrales,
            mejor comunicación online, sonidos ubicados por momento y una eliminación con peso.
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
