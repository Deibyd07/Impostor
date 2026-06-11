import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import AvatarPicker from '../../components/AvatarPicker.jsx'
import ProfileIdentityPicker from '../../components/ProfileIdentityPicker.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { profileIdentity, usePlayerProfilesStore } from '../../store/playerProfilesStore.js'
import { defaultAvatarForName, rememberAvatarForName, savedAvatarForName } from '../../data/avatars.js'

export default function JoinLobby() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const connect = useOnlineStore(s => s.connect)
  const connected = useOnlineStore(s => s.connected)
  const joinRoom = useOnlineStore(s => s.joinRoom)
  const roomCode = useOnlineStore(s => s.roomCode)
  const error = useOnlineStore(s => s.error)
  const clearError = useOnlineStore(s => s.clearError)
  const phase = useOnlineStore(s => s.phase)
  const profiles = usePlayerProfilesStore(s => s.profiles)
  const activeProfileId = usePlayerProfilesStore(s => s.activeProfileId)
  const setActiveProfile = usePlayerProfilesStore(s => s.setActiveProfile)
  const syncProfiles = usePlayerProfilesStore(s => s.syncProfiles)
  const [code, setCode] = useState((search.get('code') || '').toUpperCase().slice(0, 4))
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(defaultAvatarForName(''))
  const [avatarTouched, setAvatarTouched] = useState(false)
  const [identityId, setIdentityId] = useState(activeProfileId || 'guest')
  const codeInputRef = useRef(null)
  const selectedProfile = profiles.find(profile => profile.id === identityId) || null
  const currentName = selectedProfile?.name || name.trim()
  const currentAvatar = selectedProfile?.avatar || avatar

  useEffect(() => { connect() }, [connect])
  useEffect(() => { syncProfiles() }, [syncProfiles])
  useEffect(() => {
    if (roomCode) navigate('/online/waiting')
  }, [roomCode, navigate])
  useEffect(() => {
    if (phase === 'reveal') navigate('/online/card')
  }, [phase, navigate])
  useEffect(() => {
    if (avatarTouched) return
    setAvatar(savedAvatarForName(name) || defaultAvatarForName(name))
  }, [name, avatarTouched])
  useEffect(() => {
    const activeProfile = profiles.find(profile => profile.id === activeProfileId)
    if (!activeProfile || name.trim() || identityId !== 'guest') return
    setIdentityId(activeProfile.id)
    setName(activeProfile.name)
    setAvatar(activeProfile.avatar)
    setAvatarTouched(true)
  }, [activeProfileId, profiles, name, identityId])

  const codeReady = code.length === 4
  const ready = codeReady && currentName.length > 0 && connected

  const chooseIdentity = (nextIdentityId) => {
    setIdentityId(nextIdentityId)
    const profile = profiles.find(item => item.id === nextIdentityId)
    if (!profile) return
    setActiveProfile(profile.id)
    setName(profile.name)
    setAvatar(profile.avatar)
    setAvatarTouched(true)
  }

  const chooseAvatar = (nextAvatar) => {
    setIdentityId('guest')
    setAvatar(nextAvatar)
    setAvatarTouched(true)
    if (name.trim()) rememberAvatarForName(name, nextAvatar)
  }

  const onJoin = () => { clearError(); joinRoom(code, currentName, currentAvatar, profileIdentity(selectedProfile)) }
  const focusCodeInput = () => codeInputRef.current?.focus()

  return (
    <PhoneScreen
      className="register-screen"
      footer={
        <button
          className="btn btn-primary"
          disabled={!ready}
          onClick={onJoin}
          style={{ padding: '18px 20px', letterSpacing: '0.2em' }}
        >
          Unirse a la sala
        </button>
      }
    >
      <div className="register-nav">
        <button onClick={() => navigate('/')}>← Volver</button>
        <Badge color="var(--citizen)" dot>Unirse</Badge>
      </div>

      <div className="register-sheet">
        <span className="register-sheet__eyebrow">Ficha de acceso · Invitado</span>
        <h1 className="register-sheet__title">Introduce<br />el código</h1>

        <button
          type="button"
          onClick={focusCodeInput}
          aria-label="Escribir codigo de sala"
          style={{
            all: 'unset',
            cursor: 'text',
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            marginTop: 26,
            width: '100%',
          }}
        >
          {[0, 1, 2, 3].map(i => {
            const ch = code[i]
            const active = code.length === i
            return (
              <div key={i} className={`code-slot ${active ? 'is-active' : ''} ${ch ? 'has-value' : ''}`} style={{
                width: 56, height: 64, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, color: '#e9c277', textTransform: 'uppercase',
              }}>{ch || (active && <span style={{ width: 2, height: 28, background: '#e9c277', animation: 'caretBlink 1s steps(2) infinite' }} />)}</div>
            )
          })}
        </button>

        <input
          ref={codeInputRef}
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
          maxLength={4}
          style={{
            display: 'block', width: 1, height: 1,
            opacity: 0, position: 'absolute', pointerEvents: 'none',
          }}
        />
        <button onClick={focusCodeInput}
          style={{
            all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center',
            marginTop: 12, width: '100%', color: 'var(--ink-3)', fontFamily: 'var(--font-type)',
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>Toca para escribir código</button>

        <div className="register-sheet__field">
          <ProfileIdentityPicker
            profiles={profiles}
            value={identityId}
            onChange={chooseIdentity}
            helper="Los invitados juegan normal, pero no entran al ranking."
          />
        </div>

        <div className="register-sheet__field">
          <span className="register-sheet__label">Nombre del sospechoso</span>
          <input
            type="text"
            value={selectedProfile ? selectedProfile.name : name}
            disabled={!!selectedProfile}
            onChange={e => { setIdentityId('guest'); setName(e.target.value) }}
            placeholder="Carlos" maxLength={16}
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
