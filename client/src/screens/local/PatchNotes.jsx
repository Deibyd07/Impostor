import { useLocation, useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'

const patches = [
  {
    version: '0.2.1',
    path: '/patch-0-2-1',
    eyebrow: 'Voz y escritorio',
    title: 'Voz persistente y mesa online mas comoda',
    summary: 'Esta version mantiene la voz disponible durante toda la partida online y mejora la comodidad de las pantallas grandes para lobby y discusion.',
    highlights: [
      {
        code: 'VOZ',
        title: 'Voz durante toda la partida',
        body: 'La voz sigue disponible al revelar cartas, votar, esperar votos y revisar resultados.',
      },
      {
        code: 'ESCUCHA',
        title: 'Eliminados en modo escucha',
        body: 'Quien queda fuera de la mesa ya no puede hablar, pero puede seguir escuchando la partida.',
      },
      {
        code: 'PC',
        title: 'Escritorio mas claro',
        body: 'Lobby y discusion online usan mejor el espacio de pantalla y tienen paneles mas comodos para grupos grandes.',
      },
    ],
    sections: [
      {
        title: 'Voz de sala',
        items: [
          'El panel de voz aparece tambien al ver la carta de rol.',
          'La voz sigue activa durante votacion y espera de votos.',
          'La pantalla de resultados conserva la voz para comentar el cierre de la ronda.',
          'Los controles de volumen, entrada y salida siguen disponibles en esas fases.',
        ],
      },
      {
        title: 'Jugadores eliminados',
        items: [
          'Un jugador eliminado entra en modo escucha automaticamente.',
          'El microfono queda bloqueado para que no pueda influir en la mesa.',
          'Puede seguir oyendo a los jugadores activos hasta que termine la ronda.',
          'Durante interrogatorio, la mesa conserva sus canales separados.',
        ],
      },
      {
        title: 'Pantallas online',
        items: [
          'El lobby online aprovecha mejor el ancho de escritorio.',
          'La discusion online queda mas organizada con paneles laterales.',
          'Las listas largas tienen mejor desplazamiento para evitar contenido cortado.',
          'El panel de voz se mantiene accesible sin tapar las acciones principales.',
        ],
      },
    ],
    testFlow: [
      'Crea una sala online con tres o mas jugadores y activa la voz.',
      'Inicia partida y confirma que el panel de voz sigue visible al revelar cartas.',
      'Pasa a votacion y revisa que los jugadores sigan conectados a voz.',
      'Elimina a un jugador y confirma que escucha la mesa, pero no puede hablar.',
      'Termina la ronda y revisa que la voz siga disponible en resultados.',
    ],
  },
  {
    version: '0.2.0',
    path: '/patch-0-2-0',
    eyebrow: 'Identidad y competencia',
    title: 'Perfiles, puntos y ranking global',
    summary: 'Esta version convierte cada partida en una mesa con progreso: perfiles de jugador, ranking global y puntos visibles al cerrar cada ronda.',
    highlights: [
      {
        code: 'PERFIL',
        title: 'Perfiles de jugador',
        body: 'Cada jugador puede crear su perfil con nombre y avatar para jugar como identidad fija en partidas locales u online.',
      },
      {
        code: 'RANK',
        title: 'Ranking global',
        body: 'El menu ahora tiene una clasificacion global para ver quien va dominando entre todas las partidas registradas.',
      },
      {
        code: 'PTS',
        title: 'Puntos al final',
        body: 'Al terminar una ronda, la pantalla de victoria muestra puntos animados y el acumulado de la sala.',
      },
    ],
    sections: [
      {
        title: 'Perfiles',
        items: [
          'El menu tiene una pantalla para crear, elegir, editar y borrar perfiles.',
          'Los perfiles se pueden usar al crear sala, unirse a una sala o preparar una partida local.',
          'Jugar como invitado sigue disponible, pero no aparece en el ranking global.',
          'Los perfiles que ya habias creado se conservan al volver a jugar.',
        ],
      },
      {
        title: 'Ranking y puntos',
        items: [
          'Al ganar o perder una ronda, cada jugador ve cuantos puntos sumo.',
          'La sala mantiene un ranking acumulado durante las revanchas.',
          'Desde esa misma vista se puede cambiar al ranking global.',
          'El ranking global muestra partidas, victorias, rachas y puntos totales.',
        ],
      },
      {
        title: 'Experiencia de cierre',
        items: [
          'La victoria de ciudadanos o impostores conserva su escena dramatica.',
          'El reparto de puntos aparece con animacion y detalle de bonificaciones.',
          'Los mejores jugadores de la sala quedan resaltados para comparar rapido.',
          'La pantalla de novedades y el menu principal muestran Alpha 0.2.0.',
        ],
      },
    ],
    testFlow: [
      'Crea dos o mas perfiles desde Mis perfiles.',
      'Juega una partida local u online eligiendo esos perfiles.',
      'Termina la ronda y revisa la animacion de puntos de la sala.',
      'Cambia a Global en esa misma vista y confirma que el ranking se actualiza.',
    ],
  },
  {
    version: '0.1.0',
    path: '/patch-0-1-0',
    eyebrow: 'Alpha jugable',
    title: 'Salas online mas resistentes',
    summary: 'Version alpha enfocada en que las partidas online se recuperen mejor cuando alguien recarga, se cae o vuelve a entrar durante la partida.',
    highlights: [
      {
        code: 'VOZ',
        title: 'Voz mas confiable',
        body: 'La voz online se siente mas estable y reduce casos donde todos aparecen conectados pero nadie se escucha.',
      },
      {
        code: 'SALA',
        title: 'Conexion mas resistente',
        body: 'Las salas recuperan mejor la partida cuando alguien refresca, pierde conexion o vuelve a entrar.',
      },
      {
        code: 'PRUEBA',
        title: 'Diagnostico mas claro',
        body: 'Las pruebas de microfono y sonido ayudan a confirmar si el problema viene de permisos, entrada o salida de audio.',
      },
    ],
    sections: [
      {
        title: 'Chat de voz',
        items: [
          'Menos casos donde un jugador aparece conectado pero no escucha a la sala.',
          'Menos casos donde el microfono detecta voz local, pero los demas no la reciben.',
          'La voz mantiene volumen general y volumen por jugador para ajustar cada participante.',
          'El indicador de habla sigue mostrando quien esta hablando en la sala.',
        ],
      },
      {
        title: 'Salas online',
        items: [
          'Las salas recuperan mejor jugadores que refrescan durante una partida.',
          'El anfitrion se conserva mejor durante desconexiones cortas.',
          'Una partida en discusion vuelve a abrir en la fase correcta al reconectar.',
          'La experiencia queda preparada para pruebas con grupos mas grandes.',
        ],
      },
      {
        title: 'Historial de versiones',
        items: [
          'El menu principal muestra el parche actual 0.1.0.',
          'La pantalla de novedades permite cambiar entre versiones del historial alpha.',
          'Las notas se mantienen enfocadas en cambios que entienden los jugadores.',
        ],
      },
    ],
    testFlow: [
      'Crea una sala online con tres o mas jugadores.',
      'Lleguen a discusion y recarguen una pestana para confirmar que vuelve a la misma fase.',
      'Prueben voz, microfono y sonido con todos los jugadores conectados.',
      'Apaguen y vuelvan a levantar el servidor para confirmar que la sala se puede recuperar.',
    ],
  },
  {
    version: '0.0.5',
    path: '/patch-0-0-5',
    eyebrow: 'Mejoras de mesa',
    title: 'Voz estable y complices visibles',
    summary: 'Ajuste centrado en estabilidad online, mejor lectura del chat de voz y equipo impostor visible para partidas con varios impostores.',
    highlights: [
      {
        code: 'VOZ',
        title: 'Voz mas confiable',
        body: 'El chat de voz se recupera mejor si alguien refresca, pierde conexion o vuelve a entrar a la sala.',
      },
      {
        code: 'ALTAVOZ',
        title: 'Indicador de habla',
        body: 'Los jugadores en voz muestran un icono de altavoz cuando el microfono detecta actividad.',
      },
      {
        code: 'EQUIPO',
        title: 'Equipo impostor',
        body: 'Si hay varios impostores, cada impostor visible puede reconocer a sus complices en su carta y expediente.',
      },
    ],
    sections: [
      {
        title: 'Online y voz',
        items: [
          'La voz intenta volver sola cuando un jugador se desconecta por unos segundos.',
          'Los jugadores aparecen mejor en la lista de voz al entrar o volver a la sala.',
          'Si alguien refresca la pagina, el canal de voz queda mas preparado para recuperarse.',
          'La mesa tiene una senal visual para saber quien esta hablando en ese momento.',
        ],
      },
      {
        title: 'Roles',
        items: [
          'Los impostores visibles reciben una lista privada de sus companeros impostores.',
          'La lista aparece en la carta de rol al revelar identidad.',
          'La lista queda disponible en el expediente durante la discusion.',
          'El modo Ciego conserva el secreto: el impostor que cree ser ciudadano no ve complices.',
        ],
      },
      {
        title: 'Historial de versiones',
        items: [
          'El menu principal muestra el parche actual de forma clara.',
          'La pantalla de novedades permite cambiar entre las versiones del historial alpha.',
          'Cada version resume que se agrego y como probarlo en una partida.',
        ],
      },
    ],
    testFlow: [
      'Crea una sala online con 5 o mas jugadores y configura 2 impostores.',
      'Activa voz en dos navegadores y habla para confirmar el icono de altavoz.',
      'Inicia la partida y revisa que los impostores visibles vean sus complices.',
      'Refresca una pestana conectada a voz y confirma que vuelve a aparecer en el canal.',
    ],
  },
  {
    version: '0.0.4',
    path: '/patch-0-0-4',
    eyebrow: 'Expediente',
    title: 'Doble identidad en la mesa',
    summary: 'Parche centrado en voz online, canales privados de interrogatorio y la nueva identidad Detective-impostor.',
    highlights: [
      {
        code: 'ROL',
        title: 'Detective-impostor',
        body: 'El Detective ahora puede caer en el equipo impostor, con carta propia y habilidad para desviar la mesa desde el interrogatorio.',
      },
      {
        code: 'VOZ',
        title: 'Voz online por sala',
        body: 'Chat de voz integrado con microfono, volumen general y volumen individual por jugador desde lobby y discusion.',
      },
      {
        code: 'CANAL',
        title: 'Canales de interrogatorio',
        body: 'Cuando el Detective interroga, detective e interrogado pasan a un canal privado y el resto de la mesa habla aparte.',
      },
    ],
    sections: [
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
          'Chat de voz disponible en lobby y discusion.',
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
    ],
    testFlow: [
      'Crea una sala online con al menos tres jugadores y activa Detective.',
      'Entra al panel de voz desde lobby y ajusta el volumen de cada jugador.',
      'Inicia partida hasta discusion y prueba un interrogatorio.',
      'Verifica que Detective e interrogado se escuchan aparte y la mesa conserva su propio canal.',
    ],
  },
  {
    version: '0.0.3',
    path: '/patch-0-0-3',
    eyebrow: 'Archivo anterior',
    title: 'Mas contenido y partida persistente',
    summary: 'Parche de expansion del banco de palabras, perfiles, chat, avatares, sonidos y mejoras de flujo para salas online.',
    highlights: [
      {
        code: 'PALABRAS',
        title: 'Banco ampliado',
        body: 'El juego paso a 25 categorias con mas variedad de palabras y soporte reforzado para modo Ciego.',
      },
      {
        code: 'PERFIL',
        title: 'Perfil local',
        body: 'Se agregaron estadisticas por jugador con partidas, victorias, rachas y rendimiento como impostor.',
      },
      {
        code: 'CHAT',
        title: 'Chat y avatares',
        body: 'Las salas online ganaron chat de texto, nombres con avatar nativo y mensajes con historial reciente.',
      },
    ],
    sections: [
      {
        title: 'Contenido',
        items: [
          'Nuevas categorias: videojuegos, series TV, mitologia, cocteles, marcas, arte, arquitectura, geografia, astronomia y gastronomia colombiana.',
          'Banco expandido hasta unas 750 palabras para mayor rejugabilidad.',
          'El modo Ciego recibe palabras falsas mas cuidadas para que la confusion sea justa.',
          'Historial de palabras recientes para evitar repeticion en una misma sesion.',
        ],
      },
      {
        title: 'Jugadores',
        items: [
          'Perfil con estadisticas guardadas en este dispositivo.',
          'Avatares y emojis nativos al ingresar nombre.',
          'Avatares visibles en cartas, votos y lista de jugadores conectados.',
          'Datos de partida registrados al finalizar partidas locales y online.',
        ],
      },
      {
        title: 'Online y experiencia',
        items: [
          'Chat de texto durante la discusion online con ultimos 50 mensajes.',
          'Mensajes con nombre y avatar del remitente.',
          'Transferencia automatica de host si el anfitrion sale de la sala.',
          'Splash screen, sonidos de partida y animacion dramatica al eliminar jugadores.',
        ],
      },
    ],
    testFlow: [
      'Abre el perfil y confirma que puede mostrar estadisticas de jugador.',
      'Crea una sala online y envia mensajes desde dos jugadores.',
      'Prueba una partida con modo Ciego y una categoria nueva.',
      'Elimina un jugador para revisar sonido y animacion de eliminacion.',
    ],
  },
]

const latestPatch = patches[0]

function patchForPath(pathname) {
  return patches.find(patch => patch.path === pathname) || latestPatch
}

export default function PatchNotes() {
  const navigate = useNavigate()
  const location = useLocation()
  const patch = patchForPath(location.pathname)

  const leftPanel = (
    <PatchRail
      eyebrow={patch.eyebrow}
      title={`Version ${patch.version}`}
      body={patch.summary}
      patches={patches}
      activeVersion={patch.version}
      onSelect={(target) => navigate(target)}
    />
  )

  const rightPanel = (
    <div className="patch-rail">
      <div className="patch-rail__eyebrow">Prueba rapida</div>
      <h2>Flujo sugerido</h2>
      <ol className="patch-test-list">
        {patch.testFlow.map((step, index) => (
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
          <button onClick={() => navigate('/how')}>Como jugar</button>
        </header>

        <nav className="patch-version-tabs" aria-label="Historial de parches">
          {patches.map(item => (
            <button
              type="button"
              key={item.version}
              className={item.version === patch.version ? 'is-active' : ''}
              onClick={() => navigate(item.path)}
            >
              <span>v{item.version}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </nav>

        <section className="patch-hero" aria-labelledby="patch-title">
          <div className="patch-hero__tag">Parche {patch.version}</div>
          <h1 id="patch-title">{patch.title}</h1>
          <p>{patch.summary}</p>
        </section>

        <section className="patch-highlights" aria-label="Cambios principales">
          {patch.highlights.map(item => (
            <article className="patch-highlight-card" key={item.code}>
              <span>{item.code}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        {patch.sections.map(section => (
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

function PatchRail({ eyebrow, title, body, patches: allPatches, activeVersion, onSelect }) {
  return (
    <div className="patch-rail patch-rail--release">
      <div className="patch-rail__eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="patch-rail__history" aria-label="Todas las versiones">
        {allPatches.map(patch => (
          <button
            type="button"
            key={patch.version}
            className={patch.version === activeVersion ? 'is-active' : ''}
            onClick={() => onSelect(patch.path)}
          >
            <span>v{patch.version}</span>
            <strong>{patch.title}</strong>
          </button>
        ))}
      </div>
      <div className="patch-rail__stamp">Mesa de evidencias</div>
    </div>
  )
}
