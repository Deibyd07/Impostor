import { useLocation, useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'

const patches = [
  {
    version: '0.4.0',
    path: '/patch-0-4-0',
    eyebrow: 'Presentacion y ambiente',
    title: 'Avatares, sonidos y momentos mas dramaticos',
    summary: 'Esta version refuerza la identidad del juego con avatares ilustrados, nueva musica de fondo, efectos de sonido y animaciones mas teatrales para que cada partida se sienta mas como una mesa de misterio.',
    highlights: [
      {
        code: 'AV',
        title: 'Avatares ilustrados',
        body: 'Los perfiles ahora usan retratos visuales para que cada jugador tenga una identidad mas reconocible en sala, cartas, chat y votaciones.',
      },
      {
        code: 'SFX',
        title: 'Sonidos con mas presencia',
        body: 'La mesa suma musica de ambiente, efectos de cartas, telefonos, sellos y decisiones para acompanar los momentos importantes.',
      },
      {
        code: 'DRAMA',
        title: 'Animaciones mas cinematograficas',
        body: 'Revelaciones, eliminaciones, transiciones y escenas de Linea Privada tienen mas movimiento y peso visual.',
      },
    ],
    sections: [
      {
        title: 'Identidad de jugadores',
        items: [
          'Los emojis fueron reemplazados por avatares ilustrados en los perfiles.',
          'La pantalla de perfiles muestra retratos mas grandes para elegirlos con mejor detalle.',
          'Los avatares aparecen de forma consistente en lobby, chat, votacion, ranking y cartas.',
          'Los perfiles antiguos se adaptan automaticamente a un retrato visual.',
        ],
      },
      {
        title: 'Ambiente sonoro',
        items: [
          'Nueva musica de fondo para el menu y el lobby.',
          'Efectos nuevos para llamadas, decisiones, cartas, sellos y acciones de mesa.',
          'El juego muestra creditos de la musica y de los avatares desde el menu principal.',
          'Los controles de sonido siguen disponibles en cualquier pantalla.',
        ],
      },
      {
        title: 'Momentos de partida',
        items: [
          'Las eliminaciones y revelaciones tienen animaciones mas llamativas.',
          'Linea Privada gana sonidos y escenas propias para llamadas y resoluciones.',
          'Los jugadores eliminados quedan en espera y no pueden interferir con votos o acciones.',
          'La experiencia visual se siente mas cercana a un juego de mesa de misterio.',
        ],
      },
    ],
    testFlow: [
      'Abre el menu y confirma la nueva musica y los creditos al final.',
      'Entra a Mis perfiles y revisa los avatares ilustrados grandes.',
      'Crea una sala online y verifica avatares en lobby, chat y votacion.',
      'Juega una ronda y revisa sonidos, animaciones y bloqueo de jugadores eliminados.',
    ],
  },
  {
    version: '0.3.0',
    path: '/patch-0-3-0',
    eyebrow: 'Nuevo modo de juego',
    title: 'Línea Privada: llamadas, pactos y mentiras',
    summary: 'Llega un modo party de rondas rápidas donde todo pasa por teléfono: llamadas privadas entre jugadores, información secreta y decisiones que nadie más ve. Además, toda la mesa estrena interfaz.',
    highlights: [
      {
        code: 'LÍNEA',
        title: 'Nuevo modo Línea Privada',
        body: 'Rondas cortas con llamadas privadas uno a uno: negocia, pacta y miente sin que el resto de la mesa escuche.',
      },
      {
        code: 'JUEGOS',
        title: 'Cuatro minijuegos al teléfono',
        body: 'Habitaciones vecinas, Mensaje interceptado, Dilema del cómplice y Código de oficio, cada uno con su propia mesa de juego.',
      },
      {
        code: 'MESA',
        title: 'Interfaz renovada en todo el juego',
        body: 'Papel, sellos, puertas, telegramas y cartas de decisión: cada pantalla se siente parte del mismo caso.',
      },
    ],
    sections: [
      {
        title: 'Línea Privada',
        items: [
          'Cada ronda reparte información privada distinta y sortea un minijuego entre los que el anfitrión activó.',
          'Desde la centralita puedes llamar a cualquier jugador libre y hablar en privado: el resto no escucha esa llamada.',
          'Las decisiones se envían en secreto y al cerrar la llamada se revelan aciertos, traiciones y puntos.',
          'El anfitrión elige cuántas rondas jugar, qué minijuegos entran y sus reglas especiales.',
        ],
      },
      {
        title: 'Los cuatro minijuegos',
        items: [
          'Habitaciones vecinas: descubre quién duerme a cada lado de tu cuarto tocando puertas en un pasillo de hotel.',
          'Mensaje interceptado: junta fragmentos por llamada y escribe la frase completa en un telegrama; ojo con las piezas plantadas.',
          'Dilema del cómplice: pacta con tu pareja secreta y elige entre dos cartas, cooperar o traicionar.',
          'Código de oficio: compara procedimientos, señala al sospechoso y marca el paso exacto que lo delata.',
        ],
      },
      {
        title: 'Mesa renovada',
        items: [
          'Al elegir juego o variante, la carta seleccionada queda claramente marcada con sello, alfiler y tinta.',
          'La pantalla de ronda usa objetos reales de la mesa: formularios de papel, puertas, telegramas y fichas de sospechosos.',
          'El panel de teléfonos ahora es una centralita con lámparas y conectores que muestran quién está libre u ocupado.',
          'Estas notas de parche también estrenan presentación de expediente.',
        ],
      },
    ],
    testFlow: [
      'Crea una sala online y elige Línea Privada como juego.',
      'Activa los cuatro minijuegos y configura tres rondas.',
      'En la ronda, llama a alguien libre desde la centralita y negocien en privado.',
      'Envía tu decisión secreta y revisa el informe de puntos al cerrar la llamada.',
    ],
  },
  {
    version: '0.2.2',
    path: '/patch-0-2-2',
    eyebrow: 'Identidad visual',
    title: 'Mesa de juego con estilo de expediente',
    summary: 'Esta version empieza a transformar la experiencia para que se sienta menos como una pagina y mas como una mesa de investigacion con cartas, fichas y pistas visuales.',
    highlights: [
      {
        code: 'MESA',
        title: 'Nueva identidad de tablero',
        body: 'El menu y las pantallas online ganan detalles visuales de cartas, fichas y expediente para reforzar la fantasia del juego.',
      },
      {
        code: 'ICONOS',
        title: 'Senales mas reconocibles',
        body: 'Modos, acciones, jugadores, estado de sala y votaciones tienen iconos que ayudan a leer la partida mas rapido.',
      },
      {
        code: 'ROL',
        title: 'Cartas con mas presencia',
        body: 'Las cartas de rol y la votacion tienen marcas visuales mas dramaticas para que los momentos importantes pesen mas.',
      },
    ],
    sections: [
      {
        title: 'Menu principal',
        items: [
          'Los modos del juego ahora usan simbolos visuales propios en lugar de depender solo de texto.',
          'Las acciones principales tienen iconos de cartas, jugadores, ranking y objetivo.',
          'La seccion de novedades muestra Alpha 0.2.2 como parche actual.',
          'El menu conserva el estilo oscuro de expediente, pero con mas detalles de juego.',
        ],
      },
      {
        title: 'Lobby y sala online',
        items: [
          'La lista de jugadores conectados tiene iconos para anfitrion, espacios libres y mesa activa.',
          'El panel de estado de la sala distingue mejor modo, categoria y Detective.',
          'La invitacion y los paneles laterales se sienten mas integrados con el tema de investigacion.',
          'Los elementos importantes son mas faciles de ubicar durante la preparacion de la sala.',
        ],
      },
      {
        title: 'Cartas y votacion',
        items: [
          'Las cartas de rol incluyen simbolos grandes de fondo para reforzar ciudadano, impostor y roles especiales.',
          'La carta de Detective-impostor tiene un tratamiento visual mas intenso.',
          'La votacion marca mejor el objetivo de cada voto con una senal visual dedicada.',
          'La experiencia queda preparada para seguir sumando arte propio sin cambiar la forma de jugar.',
        ],
      },
    ],
    testFlow: [
      'Abre el menu principal y revisa los iconos de modos, acciones y novedades.',
      'Crea una sala online y confirma los iconos en jugadores, estado de sala e invitacion.',
      'Inicia una partida y revisa las cartas de rol de ciudadano, impostor o Detective.',
      'Llega a votacion y confirma que las tarjetas de voto tienen senal visual clara.',
    ],
  },
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
          <span className="stamp stamp--lg stamp--tilt-r patch-hero__stamp">Alpha {patch.version}</span>
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
