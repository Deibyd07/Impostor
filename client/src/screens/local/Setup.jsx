import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import Stepper from '../../components/Stepper.jsx'
import PlayerChip from '../../components/PlayerChip.jsx'
import ModeCard from '../../components/ModeCard.jsx'
import ChipGroup from '../../components/ChipGroup.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { categories } from '../../data/wordBank.js'
import { avatarForPlayer, rememberAvatarForName, savedAvatarForName } from '../../data/avatars.js'
import { shuffle } from '../../utils/random.js'

const nameSeeds = ['Carlos','María','Andrés','Sofía','Diego','Camila','Mateo','Valentina','Lucas','Isabella','Daniel','Lucía','Sebastián','Paula','Tomás','Renata']

function defaultName(i) { return nameSeeds[i] || `Jugador ${i + 1}` }

export default function Setup() {
  const navigate = useNavigate()
  const config = useGameStore(s => s.config)
  const setConfig = useGameStore(s => s.setConfig)
  const setPlayers = useGameStore(s => s.setPlayers)
  const startSession = useGameStore(s => s.startSession)

  const players = config.players
  const playerCount = players.length

  const renamePlayer = (i, name) => {
    const next = players.map((p, idx) => {
      if (idx !== i) return p
      const savedAvatar = savedAvatarForName(name)
      return { ...p, name, avatar: savedAvatar || p.avatar || avatarForPlayer({ name }) }
    })
    setPlayers(next)
  }
  const changeAvatar = (i, avatar) => {
    const next = players.map((p, idx) => idx === i ? { ...p, avatar } : p)
    const player = next[i]
    rememberAvatarForName(player.name, avatar)
    setPlayers(next)
  }
  const addPlayer = () => {
    if (playerCount >= 12) return
    const name = defaultName(playerCount)
    setPlayers([...players, { id: String(Date.now() + Math.random()), name, avatar: avatarForPlayer({ name }) }])
  }
  const removePlayer = (i) => {
    if (playerCount <= 3) return
    setPlayers(players.filter((_, idx) => idx !== i))
  }
  const setCount = (n) => {
    if (n > playerCount) {
      const extra = Array.from({ length: n - playerCount }, (_, k) => ({
        id: String(Date.now() + Math.random() + k),
        name: defaultName(playerCount + k),
        avatar: avatarForPlayer({ name: defaultName(playerCount + k) }),
      }))
      setPlayers([...players, ...extra])
    } else {
      setPlayers(players.slice(0, n))
    }
  }
  const randomize = () => {
    const names = shuffle(nameSeeds).slice(0, playerCount)
    setPlayers(players.map((p, i) => {
      const name = names[i] || p.name
      return { ...p, name, avatar: savedAvatarForName(name) || p.avatar || avatarForPlayer({ name }) }
    }))
  }
  const onDeal = () => {
    startSession()
    navigate('/game/pass')
  }

  const maxImpostors = Math.max(1, Math.floor(playerCount / 3))
  const impostorCount = Math.min(config.impostorCount, maxImpostors)

  return (
    <PhoneScreen
      footer={
        <button className="btn btn-primary" onClick={onDeal} style={{
          padding: '18px 20px', fontSize: 16, letterSpacing: '0.2em',
        }}>
          Repartir cartas <span style={{ marginLeft: 4 }}>→</span>
        </button>
      }
    >
      <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>←</span> Volver
        </button>
        <div className="t-eyebrow" style={{ color: 'var(--text-2)' }}>Nueva partida</div>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ padding: '0 20px' }}>
        <SectionHeader right={`${playerCount} en total`}>Jugadores</SectionHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Stepper value={playerCount} min={3} max={12} onChange={setCount} />
          <button onClick={randomize} style={{
            all: 'unset', cursor: 'pointer',
            padding: '8px 14px', borderRadius: 999,
            border: '1px solid rgba(245, 158, 11, 0.4)', color: 'var(--gold)',
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.04em',
          }}>🎲 Aleatorizar</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
          {players.map((p, i) => (
            <PlayerChip key={p.id}
              name={p.name}
              avatar={p.avatar}
              editable
              onChange={(name) => renamePlayer(i, name)}
              onAvatarChange={(avatar) => changeAvatar(i, avatar)}
              onRemove={playerCount > 3 ? () => removePlayer(i) : undefined}
            />
          ))}
          {playerCount < 12 && (
            <button onClick={addPlayer} style={{
              all: 'unset', cursor: 'pointer',
              padding: '6px 14px', borderRadius: 999,
              border: '1px dashed var(--gold)', color: 'var(--gold)',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>+ Añadir</button>
          )}
        </div>

        <SectionHeader>Impostores</SectionHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Stepper
            value={impostorCount} min={1} max={maxImpostors}
            accent="red"
            onChange={(n) => setConfig({ impostorCount: n })}
          />
        </div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: 12,
          color: 'var(--text-2)', marginBottom: 28,
        }}>
          {impostorCount} de {playerCount} jugadores {impostorCount === 1 ? 'será el impostor' : 'serán impostores'}.
        </div>

        <SectionHeader>Modo de Juego</SectionHeader>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <ModeCard icon="🎭" title="CLÁSICO" accent="red" selected={config.mode === 'classic'}
            description="El impostor no sabe la palabra."
            onClick={() => setConfig({ mode: 'classic' })} />
          <ModeCard icon="🔍" title="CON PISTA" accent="gold" selected={config.mode === 'clue'}
            description="El impostor recibe una pista."
            onClick={() => setConfig({ mode: 'clue' })} />
          <ModeCard icon="👁" title="CIEGO" accent="blue" selected={config.mode === 'blind'}
            description="El impostor no sabe que lo es."
            onClick={() => setConfig({ mode: 'blind' })} />
        </div>

        <SectionHeader>Categoría</SectionHeader>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 24,
          marginLeft: -4, marginRight: -4, paddingLeft: 4, paddingRight: 4,
        }}>
          {[{ v: 'random', label: '🎲 Aleatoria' },
            ...Object.entries(categories).map(([v, c]) => ({ v, label: `${c.icon || ''} ${c.label}`.trim() })),
          ].map(c => (
            <button key={c.v} onClick={() => setConfig({ category: c.v })} style={{
              all: 'unset', cursor: 'pointer', flexShrink: 0,
              padding: '10px 16px', borderRadius: 999,
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
              background: config.category === c.v ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-1)',
              border: `1px solid ${config.category === c.v ? 'var(--gold)' : 'var(--hairline-cold)'}`,
              color: config.category === c.v ? 'var(--gold)' : 'var(--text-1)',
              boxShadow: config.category === c.v ? '0 0 20px -8px var(--gold-glow)' : 'none',
            }}>{c.label}</button>
          ))}
        </div>

        <SectionHeader>Opciones</SectionHeader>
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline-cold)',
          borderRadius: 14, padding: 16, marginBottom: 24,
        }}>
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-2)',
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10,
          }}>Tiempo por ronda</div>
          <ChipGroup
            options={[
              { value: '1', label: '1 min' },
              { value: '3', label: '3 min' },
              { value: '5', label: '5 min' },
              { value: 'free', label: 'Libre' },
            ]}
            value={config.roundTime} onChange={(v) => setConfig({ roundTime: v })}
          />

          {config.mode === 'clue' && (
            <>
              <div style={{
                fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-2)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                marginTop: 18, marginBottom: 10,
              }}>Tipo de pista</div>
              <ChipGroup
                options={[
                  { value: 'category',    label: 'Categoría' },
                  { value: 'firstLetter', label: 'Letra inicial' },
                  { value: 'wordLength',  label: 'Nº letras' },
                  { value: 'vague',       label: 'Vaga' },
                ]}
                value={config.clueType} onChange={(v) => setConfig({ clueType: v })}
              />
            </>
          )}

          {config.mode === 'blind' && (
            <>
              <div style={{
                fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-2)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                marginTop: 18, marginBottom: 10,
              }}>Intensidad palabra falsa</div>
              <ChipGroup
                options={[
                  { value: 'near',   label: 'Cercana' },
                  { value: 'medium', label: 'Media' },
                  { value: 'far',    label: 'Lejana' },
                ]}
                value={config.blindIntensity} onChange={(v) => setConfig({ blindIntensity: v })}
              />
            </>
          )}
        </div>
      </div>
    </PhoneScreen>
  )
}
