import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import AvatarPicker from '../../components/AvatarPicker.jsx'
import ProfileIdentityPicker from '../../components/ProfileIdentityPicker.jsx'
import CornerOrnament from '../../components/CornerOrnament.jsx'
import ModeCard from '../../components/ModeCard.jsx'
import Stepper from '../../components/Stepper.jsx'
import ChipGroup from '../../components/ChipGroup.jsx'
import VoicePanel from '../../components/VoicePanel.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { profileIdentity, usePlayerProfilesStore } from '../../store/playerProfilesStore.js'
import { categories, wordBank } from '../../data/wordBank.js'
import { defaultAvatarForName, rememberAvatarForName, savedAvatarForName } from '../../data/avatars.js'

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
        footer={
          <button
            className="btn btn-primary"
            disabled={!currentName || !connected}
            onClick={() => createRoom(currentName, {
              impostorCount: 1, mode: 'classic', category: 'random',
              clueType: 'category', blindIntensity: 'medium', roundTime: '3',
              detectiveEnabled: false,
            }, currentAvatar, profileIdentity(selectedProfile))}
            style={{ padding: '18px 20px', letterSpacing: '0.2em' }}
          >
            {connected ? 'Crear sala' : 'Conectando…'}
          </button>
        }
      >
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')} style={{
            all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
            fontFamily: 'var(--font-ui)', fontSize: 13,
          }}>← Volver</button>
          <Badge color="var(--gold)" dot>Anfitrión</Badge>
        </div>
        <div style={{ padding: '40px 28px' }}>
          <div className="t-eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>Crea tu sala</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32,
            color: 'var(--text-1)', textAlign: 'center', letterSpacing: '0.04em', lineHeight: 1.05,
          }}>¿Cuál es<br />tu nombre?</div>
          <div style={{ marginTop: 24 }}>
            <ProfileIdentityPicker
              profiles={profiles}
              value={identityId}
              onChange={chooseIdentity}
              helper="Los invitados juegan normal, pero no entran al ranking."
            />
          </div>
          <div style={{ marginTop: 32 }}>
            <input
              type="text"
              value={selectedProfile ? selectedProfile.name : hostName}
              disabled={!!selectedProfile}
              onChange={(e) => { setIdentityId('guest'); setHostName(e.target.value) }}
              placeholder="Tu nombre"
              maxLength={16}
              style={{
                width: '100%', padding: '16px 18px', boxSizing: 'border-box',
                background: 'var(--surface-1)',
                border: '1px solid var(--hairline-cold)', borderRadius: 12,
                color: 'var(--text-1)', fontFamily: 'var(--font-ui)',
                fontSize: 18, fontWeight: 500, outline: 'none', textAlign: 'center',
              }}
            />
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-2)',
              letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10,
            }}>Avatar</div>
            <AvatarPicker value={avatar} onChange={chooseAvatar} />
          </div>
          {error && <div style={{ marginTop: 14, color: 'var(--impostor)', textAlign: 'center', fontSize: 13 }}>{error}</div>}
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
        <LobbyStatusPanel
          players={players}
          config={config}
        />
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
          <CornerOrnament color="rgba(245, 158, 11, 0.42)" />
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

        <VoicePanel />

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
        <QRCodeSVG value={joinUrl} size={132} bgColor="#f1f5f9" fgColor="#07070f" />
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
        <span>Jugadores conectados</span>
        <strong>{players.length}<small>/12</small></strong>
      </div>
      <div className="lobby-player-grid">
        {players.map((player, index) => (
          <div key={player.id} className={`lobby-player-card ${player.isHost ? 'is-host' : ''} ${player.ready ? 'is-ready' : ''}`}>
            <span className="lobby-player-card__index">{String(index + 1).padStart(2, '0')}</span>
            <span className="lobby-player-card__avatar">{player.avatar || player.name?.charAt(0)?.toUpperCase() || '?'}</span>
            <span className="lobby-player-card__name">{player.name}</span>
            <span className="lobby-player-card__status">
              {player.isHost ? 'Anfitrión' : player.ready ? 'Listo' : 'En espera'}
            </span>
          </div>
        ))}
        {Array.from({ length: missing }).map((_, index) => (
          <div key={`missing-${index}`} className="lobby-player-card is-empty">
            <span className="lobby-player-card__index">{String(players.length + index + 1).padStart(2, '0')}</span>
            <span className="lobby-player-card__avatar">+</span>
            <span className="lobby-player-card__name">Falta jugador</span>
            <span className="lobby-player-card__status">Mínimo requerido</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function LobbyStatusPanel({ players, config }) {
  const activeCategory = config?.category || 'random'
  const categoryLabel = activeCategory === 'random'
    ? 'Aleatoria'
    : categories[activeCategory]?.label || 'Sin categoría'
  const modeLabel = {
    classic: 'Clásico',
    clue: 'Con pista',
    blind: 'Ciego',
  }[config?.mode] || 'Sin modo'

  return (
    <aside className="lobby-status-panel">
      <div className="case-rail__stamp">Estado del caso</div>
      <div className="lobby-status-panel__metric">
        <span>En mesa</span>
        <strong>{players.length}<small>/12</small></strong>
      </div>
      <div className="lobby-status-list">
        <div>
          <span>Modo</span>
          <strong>{modeLabel}</strong>
        </div>
        <div>
          <span>Categoría</span>
          <strong>{categoryLabel}</strong>
        </div>
        <div>
          <span>Detective</span>
          <strong>{config?.detectiveEnabled ? 'Activo' : 'Inactivo'}</strong>
        </div>
      </div>
      <p className="lobby-status-panel__note">
        Cuando todos estén en la mesa, inicia la partida para repartir cartas privadas.
      </p>
    </aside>
  )
}

function HostConfigPanel({ config, setConfig, playerCount }) {
  const maxImpostors = Math.max(1, playerCount)
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
      <SectionHeader>Modo de Juego</SectionHeader>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
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

      <SectionHeader>Impostores</SectionHeader>
      <div style={{ marginBottom: 18 }}>
        <Stepper
          value={Math.min(config.impostorCount || 1, maxImpostors)}
          min={1} max={maxImpostors} accent="red"
          onChange={(n) => setConfig({ impostorCount: n })}
        />
      </div>

      <SectionHeader>Rol especial</SectionHeader>
      <button
        type="button"
        aria-pressed={!!config.detectiveEnabled}
        onClick={() => setConfig({ detectiveEnabled: !config.detectiveEnabled })}
        style={{
          all: 'unset',
          cursor: 'pointer',
          boxSizing: 'border-box',
          width: '100%',
          marginBottom: 18,
          padding: '14px 16px',
          borderRadius: 14,
          border: `1px solid ${config.detectiveEnabled ? 'rgba(245, 158, 11, 0.72)' : 'var(--hairline-cold)'}`,
          background: config.detectiveEnabled
            ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04))'
            : 'var(--surface-1)',
          boxShadow: config.detectiveEnabled ? '0 0 24px -14px var(--gold-glow)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              color: config.detectiveEnabled ? 'var(--gold)' : 'var(--text-1)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Detective</div>
            <div style={{
              marginTop: 4,
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              lineHeight: 1.4,
              color: 'var(--text-2)',
            }}>Puede iniciar un interrogatorio publico una vez por partida.</div>
          </div>
          <span style={{
            width: 42,
            height: 24,
            borderRadius: 999,
            background: config.detectiveEnabled ? 'rgba(245, 158, 11, 0.28)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${config.detectiveEnabled ? 'var(--gold)' : 'var(--hairline-cold)'}`,
            position: 'relative',
            flexShrink: 0,
          }}>
            <span style={{
              position: 'absolute',
              top: 3,
              left: config.detectiveEnabled ? 21 : 3,
              width: 16,
              height: 16,
              borderRadius: 999,
              background: config.detectiveEnabled ? 'var(--gold)' : 'var(--text-3)',
              transition: 'left 0.16s ease',
            }} />
          </span>
        </div>
      </button>

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
