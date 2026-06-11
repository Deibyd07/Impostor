import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import AvatarPicker from '../../components/AvatarPicker.jsx'
import ProfileIdentityPicker from '../../components/ProfileIdentityPicker.jsx'
import CornerOrnament from '../../components/CornerOrnament.jsx'
import GameIcon from '../../components/GameIcon.jsx'
import MaskIcon from '../../components/MaskIcon.jsx'
import ModeCard from '../../components/ModeCard.jsx'
import Stepper from '../../components/Stepper.jsx'
import ChipGroup from '../../components/ChipGroup.jsx'
import VoicePanel from '../../components/VoicePanel.jsx'
import PlayerAvatar from '../../components/PlayerAvatar.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { profileIdentity, usePlayerProfilesStore } from '../../store/playerProfilesStore.js'
import { categories, wordBank } from '../../data/wordBank.js'
import { defaultAvatarForName, rememberAvatarForName, savedAvatarForName } from '../../data/avatars.js'
import { isAlibiGame, isPartyLineGame } from '../../utils/gameTypes.js'

export default function HostLobby() {
  const navigate = useNavigate()
  const connect = useOnlineStore(s => s.connect)
  const connected = useOnlineStore(s => s.connected)
  const createRoom = useOnlineStore(s => s.createRoom)
  const roomCode = useOnlineStore(s => s.roomCode)
  const players = useOnlineStore(s => s.players)
  const config = useOnlineStore(s => s.config)
  const setConfig = useOnlineStore(s => s.setConfig)
  const startGame = useOnlineStore(s => s.startGame)
  const leaveRoom = useOnlineStore(s => s.leaveRoom)
  const error = useOnlineStore(s => s.error)
  const phase = useOnlineStore(s => s.phase)
  const profiles = usePlayerProfilesStore(s => s.profiles)
  const activeProfileId = usePlayerProfilesStore(s => s.activeProfileId)
  const setActiveProfile = usePlayerProfilesStore(s => s.setActiveProfile)
  const syncProfiles = usePlayerProfilesStore(s => s.syncProfiles)
  const [hostName, setHostName] = useState('')
  const [avatar, setAvatar] = useState(defaultAvatarForName(''))
  const [avatarTouched, setAvatarTouched] = useState(false)
  const [identityId, setIdentityId] = useState(activeProfileId || 'guest')
  const [copiedJoinUrl, setCopiedJoinUrl] = useState(false)
  const selectedProfile = profiles.find(profile => profile.id === identityId) || null
  const currentName = selectedProfile?.name || hostName.trim()
  const currentAvatar = selectedProfile?.avatar || avatar

  useEffect(() => { connect() }, [connect])
  useEffect(() => { syncProfiles() }, [syncProfiles])
  useEffect(() => {
    if (phase === 'reveal') navigate('/online/card')
  }, [phase, navigate])
  useEffect(() => {
    if (avatarTouched) return
    setAvatar(savedAvatarForName(hostName) || defaultAvatarForName(hostName))
  }, [hostName, avatarTouched])
  useEffect(() => {
    const activeProfile = profiles.find(profile => profile.id === activeProfileId)
    if (!activeProfile || hostName.trim() || identityId !== 'guest') return
    setIdentityId(activeProfile.id)
    setHostName(activeProfile.name)
    setAvatar(activeProfile.avatar)
    setAvatarTouched(true)
  }, [activeProfileId, profiles, hostName, identityId])

  const chooseIdentity = (nextIdentityId) => {
    setIdentityId(nextIdentityId)
    const profile = profiles.find(item => item.id === nextIdentityId)
    if (!profile) return
    setActiveProfile(profile.id)
    setHostName(profile.name)
    setAvatar(profile.avatar)
    setAvatarTouched(true)
  }

  const chooseAvatar = (nextAvatar) => {
    setIdentityId('guest')
    setAvatar(nextAvatar)
    setAvatarTouched(true)
    if (hostName.trim()) rememberAvatarForName(hostName, nextAvatar)
  }

  const joinUrl = roomCode
    ? `${window.location.origin}/online/join?code=${roomCode}`
    : ''
  const copyJoinUrl = async () => {
    if (!joinUrl) return
    try {
      await navigator.clipboard?.writeText(joinUrl)
      setCopiedJoinUrl(true)
      setTimeout(() => setCopiedJoinUrl(false), 1800)
    } catch {
      setCopiedJoinUrl(false)
    }
  }

  if (!roomCode) {
    return (
      <PhoneScreen
        className="register-screen"
        footer={
          <button
            className="btn btn-primary"
            disabled={!currentName || !connected}
            onClick={() => createRoom(currentName, {
              gameType: 'impostor', impostorCount: 1, mode: 'classic', category: 'random',
              clueType: 'category', blindIntensity: 'medium', roundTime: '3',
              detectiveEnabled: false, alibiRounds: 3,
              partyLineRounds: 5,
              partyLineGames: ['neighbors', 'message', 'dilemma', 'identity'],
              partyLineSettings: defaultPartyLineSettings(),
            }, currentAvatar, profileIdentity(selectedProfile))}
            style={{ padding: '18px 20px', letterSpacing: '0.2em' }}
          >
            {connected ? 'Abrir la sala' : 'Conectando…'}
          </button>
        }
      >
        <div className="register-nav">
          <button onClick={() => navigate('/')}>← Volver</button>
          <Badge color="var(--gold)" dot>Anfitrión</Badge>
        </div>
        <div className="register-sheet">
          <span className="register-sheet__eyebrow">Ficha de registro · Anfitrión</span>
          <h1 className="register-sheet__title">¿Quién dirige<br />esta mesa?</h1>
          <div className="register-sheet__field">
            <ProfileIdentityPicker
              profiles={profiles}
              value={identityId}
              onChange={chooseIdentity}
              helper="Los invitados juegan normal, pero no entran al ranking."
            />
          </div>
          <div className="register-sheet__field">
            <span className="register-sheet__label">Nombre del agente</span>
            <input
              type="text"
              value={selectedProfile ? selectedProfile.name : hostName}
              disabled={!!selectedProfile}
              onChange={(e) => { setIdentityId('guest'); setHostName(e.target.value) }}
              placeholder="Tu nombre"
              maxLength={16}
            />
          </div>
          <div className="register-sheet__field">
            <span className="register-sheet__label">Retrato</span>
            <AvatarPicker value={avatar} onChange={chooseAvatar} />
          </div>
          {error && <div className="register-sheet__error">{error}</div>}
        </div>
      </PhoneScreen>
    )
  }

  return (
    <PhoneScreen
      className="online-lobby-screen online-lobby-host-screen"
      leftPanel={
        <LobbyInvitePanel
          roomCode={roomCode}
          joinUrl={joinUrl}
          copied={copiedJoinUrl}
          onCopy={copyJoinUrl}
        />
      }
      rightPanel={
        <div className="lobby-desktop-side-stack">
          <LobbyStatusPanel
            players={players}
            config={config}
          />
          <VoicePanel compact />
        </div>
      }
      footer={
        <button
          className="btn btn-primary"
          disabled={players.length < 3}
          onClick={startGame}
          style={{ padding: '18px 20px', letterSpacing: '0.2em' }}
        >
          {players.length < 3 ? `Faltan ${3 - players.length} jugador${3 - players.length === 1 ? '' : 'es'}` : 'Iniciar partida'}
        </button>
      }
    >
      <div className="lobby-room">
        <div className="lobby-room__nav">
          <button onClick={() => { leaveRoom(); navigate('/') }}>← Salir</button>
          <Badge color="var(--gold)" dot>Anfitrión</Badge>
        </div>

        <section className="lobby-command">
          <CornerOrnament color="rgba(214, 164, 80, 0.42)" />
          <div className="lobby-command__copy">
            <div className="t-eyebrow">Sala privada</div>
            <h1>Mesa abierta</h1>
            <p>Reúne a los sospechosos, ajusta el expediente y reparte identidades cuando la mesa esté lista.</p>
          </div>
          <div className="lobby-code-stack" aria-label={`Codigo de sala ${roomCode}`}>
            {roomCode.split('').map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </div>
        </section>

        <div className="ds-mobile-only">
          <LobbyInvitePanel
            roomCode={roomCode}
            joinUrl={joinUrl}
            copied={copiedJoinUrl}
            onCopy={copyJoinUrl}
          />
        </div>

        <div className="ds-mobile-only">
          <VoicePanel />
        </div>

        <LobbyPlayersBoard players={players} />

        {config && (
          <section className="lobby-config-panel">
            <HostConfigPanel config={config} setConfig={setConfig} playerCount={players.length} />
          </section>
        )}
      </div>
    </PhoneScreen>
  )
}

function LobbyInvitePanel({ roomCode, joinUrl, copied, onCopy }) {
  return (
    <section className="lobby-invite-card">
      <div className="case-rail__stamp">Invitación</div>
      <div className="lobby-invite-card__code">
        {roomCode.split('').map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </div>
      <div className="lobby-invite-card__qr">
        <QRCodeSVG value={joinUrl} size={132} bgColor="#f3e8d2" fgColor="#160e11" />
      </div>
      <button
        type="button"
        className={`lobby-copy-link ${copied ? 'is-copied' : ''}`}
        onClick={onCopy}
      >
        <span>{joinUrl}</span>
        <strong>{copied ? 'copiado' : 'copiar'}</strong>
      </button>
    </section>
  )
}

function LobbyPlayersBoard({ players }) {
  const missing = Math.max(0, 3 - players.length)

  return (
    <section className="lobby-players-board">
      <div className="lobby-section-title">
        <span><GameIcon name="tokens" size={16} /> Jugadores conectados</span>
        <strong>{players.length}<small>/12</small></strong>
      </div>
      <div className="lobby-player-grid">
        {players.map((player, index) => (
          <div key={player.id} className={`lobby-player-card ${player.isHost ? 'is-host' : ''} ${player.ready ? 'is-ready' : ''}`}>
            <span className="lobby-player-card__index">{String(index + 1).padStart(2, '0')}</span>
            <span className="lobby-player-card__avatar">
              {player.isHost && <GameIcon name="crown" size={15} className="lobby-player-card__role-icon" />}
              <PlayerAvatar
                avatar={player.avatar}
                name={player.name}
                style={{ width: '100%', height: '100%', borderRadius: 2 }}
              />
            </span>
            <span className="lobby-player-card__name">{player.name}</span>
            <span className="lobby-player-card__status">
              {player.isHost ? 'Anfitrión' : player.ready ? 'Listo' : 'En espera'}
            </span>
          </div>
        ))}
        {Array.from({ length: missing }).map((_, index) => (
          <div key={`missing-${index}`} className="lobby-player-card is-empty">
            <span className="lobby-player-card__index">{String(players.length + index + 1).padStart(2, '0')}</span>
            <span className="lobby-player-card__avatar"><GameIcon name="token" size={20} /></span>
            <span className="lobby-player-card__name">Falta jugador</span>
            <span className="lobby-player-card__status">Mínimo requerido</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function LobbyStatusPanel({ players, config }) {
  const alibiGame = isAlibiGame(config)
  const partyLineGame = isPartyLineGame(config)
  const activeCategory = config?.category || 'random'
  const categoryLabel = activeCategory === 'random'
    ? 'Aleatoria'
    : categories[activeCategory]?.label || 'Sin categoría'
  const gameLabel = partyLineGame ? 'Linea Privada' : alibiGame ? 'Coartada' : 'El Impostor'
  const modeLabel = {
    classic: 'Clásico',
    clue: 'Con pista',
    blind: 'Ciego',
    alibi: 'Coartada',
    partyline: 'Linea Privada',
  }[config?.mode] || 'Sin modo'

  return (
    <aside className="lobby-status-panel">
      <div className="case-rail__stamp">
        <GameIcon name="notepad" size={16} />
        Estado del caso
      </div>
      <div className="lobby-status-panel__metric">
        <span>En mesa</span>
        <strong>{players.length}<small>/12</small></strong>
      </div>
      <div className="lobby-status-list">
        <div>
          <span><GameIcon name="cardsFan" size={14} /> Juego</span>
          <strong>{gameLabel}</strong>
        </div>
        {partyLineGame ? (
          <div>
            <span><GameIcon name="cardTarget" size={14} /> Rondas</span>
            <strong>{config?.partyLineRounds || 5}</strong>
          </div>
        ) : alibiGame ? (
          <div>
            <span><GameIcon name="cardTarget" size={14} /> Rondas</span>
            <strong>{config?.alibiRounds || 3}</strong>
          </div>
        ) : (
          <>
        <div>
          <span>Categoría</span>
          <strong>{categoryLabel}</strong>
        </div>
        <div>
          <span><GameIcon name="shield" size={14} /> Detective</span>
          <strong>{config?.detectiveEnabled ? 'Activo' : 'Inactivo'}</strong>
        </div>
          </>
        )}
      </div>
      <p className="lobby-status-panel__note">
        Cuando todos estén en la mesa, inicia la partida para repartir cartas privadas.
      </p>
    </aside>
  )
}

function HostConfigPanel({ config, setConfig, playerCount }) {
  const maxImpostors = Math.max(1, playerCount)
  const alibiGame = isAlibiGame(config)
  const partyLineGame = isPartyLineGame(config)
  const switchToImpostor = () => setConfig({
    gameType: 'impostor',
    mode: ['classic', 'clue', 'blind'].includes(config.mode) ? config.mode : 'classic',
    impostorCount: Math.max(1, config.impostorCount || 1),
  })
  const switchToPartyLine = () => setConfig({
    gameType: 'partyline',
    mode: 'partyline',
    detectiveEnabled: false,
    impostorCount: 1,
    partyLineRounds: config.partyLineRounds || 5,
    partyLineGames: config.partyLineGames?.length ? config.partyLineGames : ['neighbors', 'message', 'dilemma', 'identity'],
    partyLineSettings: { ...defaultPartyLineSettings(), ...(config.partyLineSettings || {}) },
  })
  const catOptions = [
    {
      value: 'random',
      label: 'Aleatoria',
      icon: '🎲',
      meta: `${Object.keys(categories).length} archivos`,
    },
    ...Object.entries(categories).map(([k, v]) => ({
      value: k,
      label: v.label,
      icon: v.icon,
      meta: `${wordBank[k]?.length || 0} palabras`,
    })),
  ]
  return (
    <>
      <SectionHeader>Juego</SectionHeader>
      <div className="mystery-game-selector" role="radiogroup" aria-label="Juego de la sala">
        <ModeCard icon="IM" title="EL IMPOSTOR" accent="red" selected={!alibiGame && !partyLineGame}
          description="Palabra secreta, impostores y sospechas."
          onClick={switchToImpostor} />
        <ModeCard icon="LP" title="LÍNEA PRIVADA" accent="blue" selected={partyLineGame}
          description="Minijuegos de llamadas, pactos y mentiras."
          onClick={switchToPartyLine} />
      </div>

      {alibiGame && (
        <>
          <SectionHeader>Coartada</SectionHeader>
          <div className="alibi-config-note">
            Juego independiente: no hay palabra secreta, impostores, categoria ni detective. Cada ronda reparte un caso y una persona sostiene una coartada falsa.
          </div>
          <SectionHeader>Rondas del caso</SectionHeader>
          <div style={{ marginBottom: 18 }}>
            <ChipGroup
              value={String(config.alibiRounds || 3)}
              onChange={(value) => setConfig({ alibiRounds: Number(value) })}
              options={[
                { value: '3', label: '3 rondas' },
                { value: '5', label: '5 rondas' },
                { value: '7', label: '7 rondas' },
              ]}
            />
          </div>
        </>
      )}

      {partyLineGame && (
        <PartyLineConfigPanel config={config} setConfig={setConfig} />
      )}

      {!alibiGame && !partyLineGame && (
        <>
      <div className="impostor-dossier">
        <span className="impostor-dossier__tab">
          <MaskIcon size={14} color="#8c1f17" />
          Expediente · El Impostor
        </span>

        <SectionHeader accent="red">Variante</SectionHeader>
        <div className="mystery-game-selector mystery-game-selector--variants" role="radiogroup" aria-label="Variante de El Impostor">
          <ModeCard icon="🎭" title="CLÁSICO" accent="red" selected={config.mode === 'classic'}
            description="El impostor no sabe la palabra."
            onClick={() => setConfig({ mode: 'classic' })} />
          <ModeCard icon="🔍" title="PISTA" accent="gold" selected={config.mode === 'clue'}
            description="El impostor recibe una pista."
            onClick={() => setConfig({ mode: 'clue' })} />
          <ModeCard icon="👁" title="CIEGO" accent="blue" selected={config.mode === 'blind'}
            description="El impostor no sabe que lo es."
            onClick={() => setConfig({ mode: 'blind' })} />
        </div>

        <SectionHeader accent="red">Impostores en la mesa</SectionHeader>
        <div className="impostor-count-row">
          <Stepper
            value={Math.min(config.impostorCount || 1, maxImpostors)}
            min={1} max={maxImpostors} accent="red"
            onChange={(n) => setConfig({ impostorCount: n })}
          />
          <div className="impostor-count-masks" aria-hidden="true">
            {Array.from({ length: Math.min(config.impostorCount || 1, maxImpostors) }).map((_, index) => (
              <span key={index} style={{ animationDelay: `${index * 70}ms` }}>
                <MaskIcon size={17} color="#8c1f17" />
              </span>
            ))}
          </div>
        </div>

        <SectionHeader accent="red">Rol especial</SectionHeader>
        <button
          type="button"
          aria-pressed={!!config.detectiveEnabled}
          onClick={() => setConfig({ detectiveEnabled: !config.detectiveEnabled })}
          className={`host-toggle ${config.detectiveEnabled ? 'is-on' : ''}`}
        >
          <div className="host-toggle__row">
            <div style={{ minWidth: 0 }}>
              <div className="host-toggle__title">Detective</div>
              <div className="host-toggle__desc">Puede iniciar un interrogatorio público una vez por partida.</div>
            </div>
            <span className="host-toggle__switch" />
          </div>
        </button>
      </div>

      <SectionHeader right={catOptions.find(opt => opt.value === (config.category || 'random'))?.meta}>
        Categoría
      </SectionHeader>
      <CategorySelector
        options={catOptions}
        value={config.category || 'random'}
        onChange={(category) => setConfig({ category })}
      />

      {config.mode === 'clue' && (
        <>
          <SectionHeader>Tipo de pista</SectionHeader>
          <div style={{ marginBottom: 18 }}>
            <ChipGroup
              value={config.clueType || 'category'}
              onChange={(v) => setConfig({ clueType: v })}
              options={[
                { value: 'category',    label: 'Categoría' },
                { value: 'firstLetter', label: 'Primera letra' },
                { value: 'wordLength',  label: 'Nº letras' },
                { value: 'vague',       label: 'Vaga' },
              ]}
            />
          </div>
        </>
      )}

      {config.mode === 'blind' && (
        <>
          <SectionHeader>Intensidad ciego</SectionHeader>
          <div style={{ marginBottom: 18 }}>
            <ChipGroup
              value={config.blindIntensity || 'medium'}
              onChange={(v) => setConfig({ blindIntensity: v })}
              options={[
                { value: 'near',   label: 'Cercana' },
                { value: 'medium', label: 'Media' },
                { value: 'far',    label: 'Lejana' },
              ]}
            />
            <div style={{
              marginTop: 8, fontSize: 11.5, color: 'var(--text-3)',
              fontStyle: 'italic', fontFamily: 'var(--font-ui)', lineHeight: 1.45,
            }}>
              {(config.blindIntensity || 'medium') === 'near' && 'Palabra falsa muy similar — duro de detectar.'}
              {(config.blindIntensity || 'medium') === 'medium' && 'Misma categoría — confusión moderada.'}
              {(config.blindIntensity || 'medium') === 'far' && 'Otra categoría — el impostor sospechará rápido.'}
            </div>
          </div>
        </>
      )}
        </>
      )}
    </>
  )
}

const PARTYLINE_GAMES = [
  { id: 'neighbors', title: 'Habitaciones vecinas', desc: 'Adivinar vecinos por numeros consecutivos.' },
  { id: 'message', title: 'Mensaje interceptado', desc: 'Reconstruir la frase y detectar fragmentos falsos.' },
  { id: 'dilemma', title: 'Dilema del complice', desc: 'Cooperar o traicionar en secreto.' },
  { id: 'identity', title: 'Codigo de oficio', desc: 'Comparar protocolos y detectar el procedimiento falso.' },
]

function defaultPartyLineSettings() {
  return {
    neighbors: { strictOrder: true },
    message: { decoyCount: 1 },
    dilemma: { highStakes: false },
    identity: { outsiderCount: 1 },
  }
}

function PartyLineConfigPanel({ config, setConfig }) {
  const enabledGames = config.partyLineGames?.length
    ? config.partyLineGames
    : PARTYLINE_GAMES.map(game => game.id)
  const settings = { ...defaultPartyLineSettings(), ...(config.partyLineSettings || {}) }

  const setSettings = (gameId, patch) => {
    setConfig({
      partyLineSettings: {
        ...settings,
        [gameId]: {
          ...(settings[gameId] || {}),
          ...patch,
        },
      },
    })
  }

  const toggleGame = (gameId) => {
    const active = enabledGames.includes(gameId)
    const next = active
      ? enabledGames.filter(id => id !== gameId)
      : [...enabledGames, gameId]
    if (!next.length) return
    setConfig({ partyLineGames: next })
  }

  return (
    <>
      <SectionHeader>Linea Privada</SectionHeader>
      <div className="alibi-config-note">
        Modo party independiente: cada ronda escoge un minijuego activo, reparte informacion privada y suma puntos.
      </div>

      <SectionHeader>Rondas</SectionHeader>
      <div style={{ marginBottom: 18 }}>
        <ChipGroup
          value={String(config.partyLineRounds || 5)}
          onChange={(value) => setConfig({ partyLineRounds: Number(value) })}
          options={[
            { value: '3', label: '3 rondas' },
            { value: '5', label: '5 rondas' },
            { value: '7', label: '7 rondas' },
            { value: '10', label: '10 rondas' },
          ]}
        />
      </div>

      <SectionHeader right={`${enabledGames.length}/4`}>Minijuegos activos</SectionHeader>
      <div className="partyline-config-grid">
        {PARTYLINE_GAMES.map(game => {
          const active = enabledGames.includes(game.id)
          return (
            <button
              type="button"
              key={game.id}
              aria-pressed={active}
              className={`partyline-config-card ${active ? 'is-active' : ''}`}
              onClick={() => toggleGame(game.id)}
            >
              <strong>{game.title}</strong>
              <span>{game.desc}</span>
            </button>
          )
        })}
      </div>

      {enabledGames.includes('neighbors') && (
        <HostSwitch
          title="Vecinos con orden exacto"
          desc="Izquierda es el cuarto anterior y derecha el siguiente. Si lo apagas, basta con encontrar los dos vecinos."
          active={settings.neighbors?.strictOrder !== false}
          onClick={() => setSettings('neighbors', { strictOrder: settings.neighbors?.strictOrder === false })}
        />
      )}

      {enabledGames.includes('message') && (
        <>
          <SectionHeader>Mensaje interceptado</SectionHeader>
          <ChipGroup
            value={String(settings.message?.decoyCount || 1)}
            onChange={(value) => setSettings('message', { decoyCount: Number(value) })}
            options={[
              { value: '1', label: '1 falso' },
              { value: '2', label: '2 falsos' },
            ]}
          />
        </>
      )}

      {enabledGames.includes('dilemma') && (
        <HostSwitch
          title="Dilema de alto riesgo"
          desc="La traicion paga mas, pero dos traidores pierden puntos."
          active={!!settings.dilemma?.highStakes}
          onClick={() => setSettings('dilemma', { highStakes: !settings.dilemma?.highStakes })}
        />
      )}

      {enabledGames.includes('identity') && (
        <>
          <SectionHeader>Codigo de oficio</SectionHeader>
          <ChipGroup
            value={String(settings.identity?.outsiderCount || 1)}
            onChange={(value) => setSettings('identity', { outsiderCount: Number(value) })}
            options={[
              { value: '1', label: '1 protocolo falso' },
              { value: '2', label: '2 protocolos falsos' },
            ]}
          />
        </>
      )}
    </>
  )
}

function HostSwitch({ title, desc, active, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`host-toggle ${active ? 'is-on' : ''}`}
    >
      <div className="host-toggle__row">
        <div style={{ minWidth: 0 }}>
          <div className="host-toggle__title">{title}</div>
          <div className="host-toggle__desc">{desc}</div>
        </div>
        <span className="host-toggle__switch" />
      </div>
    </button>
  )
}

function CategorySelector({ options, value, onChange }) {
  const selected = options.find(opt => opt.value === value) || options[0]

  return (
    <div className="category-dossier">
      <div className="category-dossier__active">
        <span className="category-dossier__stamp">Archivo seleccionado</span>
        <span className="category-dossier__icon">{selected.icon}</span>
        <div className="category-dossier__copy">
          <strong>{selected.label}</strong>
          <span>{selected.meta}</span>
        </div>
      </div>

      <div className="category-grid" role="radiogroup" aria-label="Categoria de palabras">
        {options.map((option, index) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`category-card ${option.value === 'random' ? 'category-card--random' : ''} ${active ? 'is-active' : ''}`}
              onClick={() => onChange(option.value)}
            >
              <span className="category-card__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="category-card__icon">{option.icon}</span>
              <span className="category-card__label">{option.label}</span>
              <span className="category-card__meta">{option.meta}</span>
              {active && <span className="category-card__mark">Activo</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
