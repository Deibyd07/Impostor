import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import ConnectedPlayer from '../../components/ConnectedPlayer.jsx'
import AvatarPicker from '../../components/AvatarPicker.jsx'
import CornerOrnament from '../../components/CornerOrnament.jsx'
import ModeCard from '../../components/ModeCard.jsx'
import Stepper from '../../components/Stepper.jsx'
import ChipGroup from '../../components/ChipGroup.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { categories } from '../../data/wordBank.js'
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
  const [hostName, setHostName] = useState('')
  const [avatar, setAvatar] = useState(defaultAvatarForName(''))
  const [avatarTouched, setAvatarTouched] = useState(false)
  const [copiedJoinUrl, setCopiedJoinUrl] = useState(false)

  useEffect(() => { connect() }, [connect])
  useEffect(() => {
    if (phase === 'reveal') navigate('/online/card')
  }, [phase, navigate])
  useEffect(() => {
    if (avatarTouched) return
    setAvatar(savedAvatarForName(hostName) || defaultAvatarForName(hostName))
  }, [hostName, avatarTouched])

  const chooseAvatar = (nextAvatar) => {
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
            disabled={!hostName.trim() || !connected}
            onClick={() => createRoom(hostName.trim(), {
              impostorCount: 1, mode: 'classic', category: 'random',
              clueType: 'category', blindIntensity: 'medium', roundTime: '3',
              detectiveEnabled: false,
            }, avatar)}
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
          <div style={{ marginTop: 32 }}>
            <input
              type="text" value={hostName} onChange={(e) => setHostName(e.target.value)}
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
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => { leaveRoom(); navigate('/') }} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13,
        }}>← Salir</button>
        <Badge color="var(--gold)" dot>Anfitrión</Badge>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="grain" style={{
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02) 60%, transparent)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 22, padding: '24px 20px 20px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 60px -20px rgba(245, 158, 11, 0.4)',
        }}>
          <CornerOrnament color="rgba(245, 158, 11, 0.5)" />
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Código de sala</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56,
            color: 'var(--text-1)', letterSpacing: '0.18em', lineHeight: 1,
            textShadow: '0 0 28px var(--gold-glow), 0 2px 1px rgba(0,0,0,0.6)',
            display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            {roomCode.split('').map((ch, i) => (
              <span key={i} style={{
                display: 'inline-block', minWidth: 38,
                padding: '4px 6px', borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}>{ch}</span>
            ))}
          </div>
          <div className="hr-gold-soft" style={{ margin: '20px auto', width: '60%' }} />
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-2)',
            letterSpacing: '0.04em', lineHeight: 1.5,
          }}>Comparte el código o escanea el QR<br />desde otro dispositivo.</div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: 8, background: '#f1f5f9', borderRadius: 10 }}>
              <QRCodeSVG value={joinUrl} size={120} bgColor="#f1f5f9" fgColor="#07070f" />
            </div>
          </div>
          <button
            onClick={copyJoinUrl}
            style={{
              marginTop: 12, all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, maxWidth: '100%', padding: '6px 10px', borderRadius: 999,
              background: copiedJoinUrl ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
              border: `1px solid ${copiedJoinUrl ? 'rgba(34, 197, 94, 0.45)' : 'transparent'}`,
              fontFamily: 'ui-monospace, SF Mono, monospace',
              fontSize: 11, color: copiedJoinUrl ? 'var(--victory)' : 'var(--text-3)', letterSpacing: '0.04em',
              transition: 'background 160ms ease, border-color 160ms ease, color 160ms ease',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joinUrl}</span>
            <span style={{
              color: copiedJoinUrl ? 'var(--victory)' : 'var(--gold)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>{copiedJoinUrl ? 'copiado' : 'copiar'}</span>
          </button>
        </div>

        <div style={{
          marginTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <SectionHeader>Jugadores conectados</SectionHeader>
          <div style={{
            fontFamily: 'var(--font-num)', fontSize: 22,
            color: 'var(--gold)', letterSpacing: '0.05em',
          }}>{players.length}<span style={{ color: 'var(--text-faint)', fontSize: 14 }}> / 12</span></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {players.map(p => (
            <ConnectedPlayer
              key={p.id} name={p.name} avatar={p.avatar} isHost={p.isHost}
              isYou={p.isHost}
              status={p.ready ? 'ready' : 'waiting'}
            />
          ))}
          {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
            <ConnectedPlayer key={`ph${i}`} placeholder />
          ))}
        </div>

        {config && <HostConfigPanel config={config} setConfig={setConfig} playerCount={players.length} />}
      </div>
    </PhoneScreen>
  )
}

function HostConfigPanel({ config, setConfig, playerCount }) {
  const maxImpostors = Math.max(1, playerCount)
  const catOptions = [
    { value: 'random', label: '🎲 Aleatoria' },
    ...Object.entries(categories).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` })),
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

      <SectionHeader>Categoría</SectionHeader>
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 18,
        WebkitOverflowScrolling: 'touch',
      }}>
        {catOptions.map(opt => {
          const active = (config.category || 'random') === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setConfig({ category: opt.value })}
              style={{
                all: 'unset', cursor: 'pointer', flexShrink: 0,
                padding: '8px 14px', borderRadius: 999,
                fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 500,
                background: active ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-1)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--hairline-cold)'}`,
                color: active ? 'var(--gold)' : 'var(--text-2)',
                whiteSpace: 'nowrap',
              }}
            >{opt.label}</button>
          )
        })}
      </div>

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
