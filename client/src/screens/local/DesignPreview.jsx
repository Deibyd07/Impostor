import { useEffect } from 'react'
import RoleCard from '../../components/RoleCard.jsx'
import AlibiCard from '../../components/AlibiCard.jsx'
import AlibiMap from '../../components/AlibiMap.jsx'
import VoteCard from '../../components/VoteCard.jsx'
import DetectiveInterrogationPanel from '../../components/DetectiveInterrogationPanel.jsx'
import Badge from '../../components/Badge.jsx'

/**
 * /design-preview — galería interna de piezas del sistema «Lámpara y Tinta».
 * Solo datos simulados: no usa sockets ni estado online.
 */

const mockMap = {
  name: 'Estación San Aurelio',
  width: 6,
  height: 4,
  crimeScene: 'Andén 2',
  zones: [
    { id: 'platform-1', name: 'Andén 1', shortName: 'Andén 1', x: 0, y: 0, w: 2, h: 1, type: 'platform', note: 'Bancos mojados y vista parcial hacia el Andén 2.' },
    { id: 'platform-2', name: 'Andén 2', shortName: 'Andén 2', x: 2, y: 0, w: 2, h: 1, type: 'crime', note: 'Escena del crimen. La víctima apareció junto a la vía.' },
    { id: 'radio', name: 'Cabina de radio', shortName: 'Radio', x: 4, y: 0, w: 2, h: 1, type: 'control', note: 'El micrófono quedó abierto y grabó respiración.' },
    { id: 'ticket-office', name: 'Taquilla', shortName: 'Taquilla', x: 0, y: 1, w: 1, h: 1, type: 'public', note: 'La ventanilla mira hacia la sala de espera.' },
    { id: 'waiting-room', name: 'Sala de espera', shortName: 'Espera', x: 1, y: 1, w: 2, h: 1, type: 'public', note: 'Desde los bancos se ve una sombra cruzar.' },
    { id: 'cafeteria', name: 'Cafetería cerrada', shortName: 'Café', x: 3, y: 1, w: 1, h: 1, type: 'service', note: 'La puerta fue forzada desde dentro.' },
    { id: 'luggage', name: 'Bodega de equipaje', shortName: 'Bodega', x: 4, y: 1, w: 2, h: 1, type: 'service', note: 'Huellas húmedas salen hacia el pasillo interno.' },
    { id: 'maintenance', name: 'Pasillo de mantenimiento', shortName: 'Pasillo', x: 0, y: 2, w: 2, h: 1, type: 'route', note: 'Ruta oculta entre bodega, archivo y andenes.' },
    { id: 'office', name: 'Oficina del jefe', shortName: 'Oficina', x: 2, y: 2, w: 2, h: 1, type: 'control', note: 'El reloj de pared se detuvo a las 11:47.' },
    { id: 'restrooms', name: 'Baños', shortName: 'Baños', x: 4, y: 2, w: 1, h: 1, type: 'public', note: 'El lavamanos quedó abierto.' },
    { id: 'exit-hall', name: 'Vestíbulo principal', shortName: 'Vestíbulo', x: 5, y: 2, w: 1, h: 2, type: 'public', note: 'Puertas cerradas por seguridad.' },
    { id: 'archive', name: 'Archivo de rutas', shortName: 'Archivo', x: 0, y: 3, w: 2, h: 1, type: 'service', note: 'Mapas antiguos muestran accesos internos.' },
    { id: 'electrical', name: 'Cuarto eléctrico', shortName: 'Electricidad', x: 2, y: 3, w: 2, h: 1, type: 'control', note: 'La caja de fusibles fue manipulada.' },
    { id: 'locker', name: 'Casilleros', shortName: 'Casilleros', x: 4, y: 3, w: 1, h: 1, type: 'service', note: 'Un casillero huele a lluvia y papel quemado.' },
  ],
  routes: [
    ['platform-1', 'platform-2'],
    ['platform-2', 'waiting-room'],
    ['platform-2', 'radio'],
    ['waiting-room', 'ticket-office'],
    ['waiting-room', 'cafeteria'],
    ['cafeteria', 'luggage'],
    ['luggage', 'maintenance'],
    ['maintenance', 'platform-1'],
    ['maintenance', 'archive'],
    ['maintenance', 'office'],
    ['office', 'electrical'],
    ['office', 'restrooms'],
    ['restrooms', 'exit-hall'],
    ['restrooms', 'locker'],
    ['locker', 'exit-hall'],
  ],
}

const witnessAlibi = {
  role: 'alibi-witness',
  title: 'El último tren de medianoche',
  claimedLocation: 'Sala de espera',
  statement: 'Me quedé junto a los bancos porque la tormenta bloqueó la salida.',
  saw: 'Una silueta se movió hacia el Andén 2 durante el apagón.',
  heard: 'Primero una campana, después un golpe.',
  detail: 'Esta zona conecta visualmente con andenes y taquilla.',
  clue: 'Si alguien dice estar en la Cabina de radio, pregúntale el orden de los sonidos.',
  objective: 'Encuentra la coartada falsa.',
}

const liarAlibi = {
  role: 'alibi-liar',
  title: 'El último tren de medianoche',
  claimedLocation: 'Taquilla',
  realLocation: 'Pasillo de mantenimiento',
  statement: 'Contaba monedas bajo la ventanilla mientras esperaba instrucciones.',
  clue: 'Mantenla simple: estabas allí, oíste el apagón y no viste la cara de nadie.',
  objective: 'Evita que te descubran.',
  risk: 'No puedes afirmar haber visto el golpe ni la Cabina de radio.',
}

const detectiveAlibi = {
  role: 'alibi-detective',
  title: 'El último tren de medianoche',
  statement: 'Escucha cada versión y cruza mapa, sonidos y evidencia.',
  clue: 'La mentira suele fallar en una ruta, un sonido o un detalle de visibilidad.',
  objective: 'Acusa al sospechoso de la coartada falsa.',
}

const mockPlayers = [
  { id: 'p1', name: 'Marlowe', avatar: '🕵️' },
  { id: 'p2', name: 'Vera', avatar: '🦊' },
  { id: 'p3', name: 'Otto', avatar: '🎩' },
  { id: 'p4', name: 'Ada', avatar: '🐈‍⬛' },
]

function Section({ title, children, wide = false, id }) {
  return (
    <section id={id} style={{ marginBottom: 44, maxWidth: wide ? 1280 : 1080, marginInline: 'auto' }}>
      <div style={{
        fontFamily: 'var(--font-type)', fontSize: 12, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ flexShrink: 0 }}>{title}</span>
        <span className="thread-line" style={{ flex: 1 }} />
      </div>
      {children}
    </section>
  )
}

export default function DesignPreview() {
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const jump = () => document.getElementById(id)?.scrollIntoView()
    if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(jump, 80))
    else setTimeout(jump, 600)
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '46px 30px 80px', overflowX: 'hidden' }}>
      <header style={{ textAlign: 'center', marginBottom: 46 }}>
        <div className="stamp stamp--lg" style={{ marginBottom: 14 }}>Galería interna</div>
        <h1 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 0.95, color: 'var(--text-1)',
        }}>Lámpara y Tinta</h1>
        <p style={{
          margin: '10px 0 0', fontFamily: 'var(--font-type)', fontSize: 13,
          color: 'var(--text-3)', letterSpacing: '0.08em',
        }}>/design-preview · piezas del sistema con datos simulados</p>
      </header>

      <Section title="Botones y sellos">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, alignItems: 'start' }}>
          <button className="btn btn-primary">Iniciar partida</button>
          <button className="btn btn-secondary">Reanudar caso</button>
          <button className="btn btn-ghost">Salir de la sala</button>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="stamp">Confidencial</span>
            <span className="stamp stamp--green stamp--tilt-r">Resuelto</span>
            <span className="stamp stamp--gold stamp--flat">Autoridad</span>
            <Badge color="var(--gold)" dot>Anfitrión</Badge>
            <Badge color="var(--impostor)" warn>Impostor</Badge>
          </div>
        </div>
      </Section>

      <Section id="cartas" title="Cartas de identidad — El Impostor">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 26 }}>
          <RoleCard variant="citizen" word="Submarino" seconds={6} totalSeconds={8} />
          <RoleCard variant="detective" word="Submarino" seconds={6} totalSeconds={8} />
          <RoleCard
            variant="impostor-clue"
            clue="Se mueve bajo el agua"
            impostorTeammates={[{ id: 't1', name: 'Vera', avatar: '🦊' }]}
            seconds={6}
            totalSeconds={8}
          />
        </div>
      </Section>

      <Section id="coartadas" title="Hojas de coartada — modo Coartada">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 26 }}>
          <AlibiCard alibi={witnessAlibi} seconds={5} totalSeconds={8} />
          <AlibiCard alibi={liarAlibi} seconds={5} totalSeconds={8} />
          <AlibiCard alibi={detectiveAlibi} seconds={5} totalSeconds={8} />
        </div>
      </Section>

      <Section id="plano" title="El plano del caso" wide>
        <AlibiMap map={mockMap} highlight="Sala de espera" />
      </Section>

      <Section id="interrogatorio" title="Interrogatorio del detective">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 26, alignItems: 'start' }}>
          <DetectiveInterrogationPanel
            players={mockPlayers}
            myId="p1"
            role="detective"
            interrogation={null}
            used={false}
            onStart={() => {}}
          />
          <DetectiveInterrogationPanel
            players={mockPlayers}
            myId="p1"
            role="detective"
            interrogation={{
              detectiveId: 'p1',
              targetId: 'p3',
              detectiveName: 'Marlowe',
              detectiveAvatar: '🕵️',
              targetName: 'Otto',
              targetAvatar: '🎩',
              prompt: '¿Qué escuchaste exactamente durante el apagón?',
              expiresAt: Date.now() + 40000,
            }}
            used={false}
            onStart={() => {}}
          />
          <DetectiveInterrogationPanel
            players={mockPlayers}
            myId="p4"
            role="citizen"
            interrogation={{
              detectiveId: 'p1',
              targetId: 'p3',
              detectiveName: 'Marlowe',
              detectiveAvatar: '🕵️',
              targetName: 'Otto',
              targetAvatar: '🎩',
              prompt: 'oculto',
              expiresAt: Date.now() + 40000,
            }}
            used={false}
            onStart={() => {}}
          />
        </div>
      </Section>

      <Section id="acusacion" title="La acusación (votación)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 20 }}>
          <VoteCard name="Marlowe" avatar="🕵️" votes={0} />
          <VoteCard name="Vera" avatar="🦊" votes={2} />
          <VoteCard name="Otto" avatar="🎩" votes={4} isLeader />
          <VoteCard name="Ada" avatar="🐈‍⬛" votes={0} disabled />
        </div>
      </Section>

      <Section id="corcho" title="Corcho de jugadores">
        <div className="discussion-table">
          <div className="discussion-player-grid">
            {mockPlayers.map((p, i) => (
              <article key={p.id} className={`discussion-player-card ${i === 0 ? 'is-first' : ''} ${i === 1 ? 'is-you' : ''} ${i === 3 ? 'is-out' : ''}`}>
                <span className="discussion-player-card__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="discussion-avatar">{p.avatar}</span>
                <div className="discussion-player-card__body">
                  <strong>{p.name}</strong>
                  <span>{i === 0 ? 'Abre la ronda' : i === 3 ? 'Eliminado' : 'En escucha'}</span>
                </div>
                {i === 1 && <span className="discussion-player-card__you">Tú</span>}
              </article>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}
