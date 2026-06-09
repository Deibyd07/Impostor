import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import AvatarPicker from '../../components/AvatarPicker.jsx'
import { usePlayerProfilesStore } from '../../store/playerProfilesStore.js'
import { defaultAvatarForName } from '../../data/avatars.js'

export default function Profile() {
  const navigate = useNavigate()
  const profiles = usePlayerProfilesStore(s => s.profiles)
  const activeProfileId = usePlayerProfilesStore(s => s.activeProfileId)
  const loading = usePlayerProfilesStore(s => s.loading)
  const error = usePlayerProfilesStore(s => s.error)
  const syncProfiles = usePlayerProfilesStore(s => s.syncProfiles)
  const createProfile = usePlayerProfilesStore(s => s.createProfile)
  const updateProfile = usePlayerProfilesStore(s => s.updateProfile)
  const deleteProfile = usePlayerProfilesStore(s => s.deleteProfile)
  const setActiveProfile = usePlayerProfilesStore(s => s.setActiveProfile)

  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(defaultAvatarForName(''))
  const [avatarTouched, setAvatarTouched] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [savingError, setSavingError] = useState(null)

  const editingProfile = profiles.find(profile => profile.id === editingId) || null

  useEffect(() => { syncProfiles() }, [syncProfiles])
  useEffect(() => {
    if (avatarTouched) return
    setAvatar(defaultAvatarForName(name))
  }, [name, avatarTouched])

  const resetForm = () => {
    setName('')
    setAvatar(defaultAvatarForName(''))
    setAvatarTouched(false)
    setEditingId(null)
    setSavingError(null)
  }

  const startEdit = (profile) => {
    setEditingId(profile.id)
    setName(profile.name)
    setAvatar(profile.avatar)
    setAvatarTouched(true)
    setSavingError(null)
  }

  const onSubmit = async () => {
    const cleanName = name.trim()
    if (!cleanName || loading) return
    setSavingError(null)
    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, { name: cleanName, avatar })
      } else {
        await createProfile(cleanName, avatar)
      }
      resetForm()
    } catch (err) {
      setSavingError(err?.message || 'No se pudo guardar el perfil')
    }
  }

  const onDelete = async (profile) => {
    setSavingError(null)
    try {
      await deleteProfile(profile.id)
      if (editingId === profile.id) resetForm()
    } catch (err) {
      setSavingError(err?.message || 'No se pudo borrar el perfil')
    }
  }

  return (
    <PhoneScreen>
      <div style={{
        minHeight: '100vh',
        padding: '0 22px 34px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <button onClick={() => navigate('/')} style={backButtonStyle}>Volver</button>
          <Badge color="var(--gold)" dot>Supabase</Badge>
        </header>

        <div>
          <div className="t-eyebrow" style={{ color: 'var(--gold)', marginBottom: 10 }}>Identidad</div>
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: 'var(--text-1)',
            textShadow: '0 0 24px var(--gold-glow)',
          }}>Mis perfiles</h1>
          <p className="t-meta" style={{ marginTop: 10, lineHeight: 1.5 }}>
            Cada perfil se guarda en Supabase y se puede usar en partidas locales u online.
          </p>
        </div>

        <section>
          <SectionHeader right={editingProfile ? 'Editando' : 'Nuevo'}>Perfil</SectionHeader>
          <div style={panelStyle}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={16}
              placeholder="Nombre del jugador"
              style={inputStyle}
            />
            <AvatarPicker value={avatar} onChange={(nextAvatar) => { setAvatar(nextAvatar); setAvatarTouched(true) }} />
            <div style={{ display: 'grid', gridTemplateColumns: editingProfile ? '1fr 1fr' : '1fr', gap: 10 }}>
              {editingProfile && (
                <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
                  Cancelar
                </button>
              )}
              <button
                type="button"
                disabled={!name.trim() || loading}
                onClick={onSubmit}
                style={primaryButtonStyle(!name.trim() || loading)}
              >
                {loading ? 'Guardando...' : editingProfile ? 'Guardar cambios' : 'Crear perfil'}
              </button>
            </div>
            {(savingError || error) && (
              <div style={errorStyle}>{savingError || error}</div>
            )}
          </div>
        </section>

        <section>
          <SectionHeader right={`${profiles.length}/12`}>Guardados</SectionHeader>
          {profiles.length === 0 ? (
            <div style={emptyStyle}>
              <strong>No hay perfiles todavia</strong>
              <span>Crea uno para aparecer en el ranking global cuando termines partidas.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profiles.map(profile => {
                const active = profile.id === activeProfileId
                return (
                  <article key={profile.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '46px 1fr auto',
                    gap: 11,
                    alignItems: 'center',
                    padding: 13,
                    borderRadius: 14,
                    border: `1px solid ${active ? 'var(--gold)' : 'var(--hairline-cold)'}`,
                    background: active ? 'rgba(245, 158, 11, 0.10)' : 'rgba(255,255,255,0.03)',
                  }}>
                    <div style={avatarStyle}>{profile.avatar}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text-1)',
                        fontSize: 18,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>{profile.name}</div>
                      <div className="t-meta">
                        {active ? 'Perfil activo' : 'Disponible para jugar'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button type="button" onClick={() => setActiveProfile(profile.id)} style={miniButtonStyle(active)}>
                        {active ? 'Activo' : 'Usar'}
                      </button>
                      <button type="button" onClick={() => startEdit(profile)} style={miniButtonStyle(false)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => onDelete(profile)} style={dangerMiniButtonStyle}>
                        Borrar
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </PhoneScreen>
  )
}

const backButtonStyle = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-2)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

const panelStyle = {
  padding: 14,
  borderRadius: 14,
  border: '1px solid var(--hairline-cold)',
  background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const inputStyle = {
  width: '100%',
  minHeight: 46,
  boxSizing: 'border-box',
  borderRadius: 10,
  border: '1px solid var(--hairline-cold)',
  background: 'var(--surface-1)',
  color: 'var(--text-1)',
  fontFamily: 'var(--font-ui)',
  fontSize: 15,
  fontWeight: 700,
  outline: 'none',
  padding: '0 12px',
}

function primaryButtonStyle(disabled) {
  return {
    all: 'unset',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 46,
    borderRadius: 10,
    border: `1px solid ${disabled ? 'var(--hairline-cold)' : 'var(--gold)'}`,
    background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(245, 158, 11, 0.14)',
    color: disabled ? 'var(--text-3)' : 'var(--gold)',
    fontFamily: 'var(--font-ui)',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.14em',
    textAlign: 'center',
    textTransform: 'uppercase',
  }
}

const secondaryButtonStyle = {
  ...primaryButtonStyle(false),
  border: '1px solid var(--hairline-cold)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text-2)',
}

const errorStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(239, 68, 68, 0.35)',
  background: 'rgba(239, 68, 68, 0.08)',
  color: 'var(--impostor)',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  lineHeight: 1.4,
}

const emptyStyle = {
  padding: 20,
  borderRadius: 14,
  border: '1px solid var(--hairline-cold)',
  background: 'rgba(255,255,255,0.03)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: 'var(--text-2)',
  fontFamily: 'var(--font-ui)',
  fontSize: 13,
  lineHeight: 1.45,
}

const avatarStyle = {
  width: 44,
  height: 44,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(245, 158, 11, 0.45)',
  background: 'rgba(245, 158, 11, 0.10)',
  fontSize: 22,
}

function miniButtonStyle(active) {
  return {
    all: 'unset',
    cursor: 'pointer',
    minWidth: 66,
    padding: '7px 9px',
    borderRadius: 999,
    border: `1px solid ${active ? 'var(--gold)' : 'var(--hairline-cold)'}`,
    color: active ? 'var(--gold)' : 'var(--text-2)',
    background: active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)',
    fontFamily: 'var(--font-ui)',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.12em',
    textAlign: 'center',
    textTransform: 'uppercase',
  }
}

const dangerMiniButtonStyle = {
  ...miniButtonStyle(false),
  border: '1px solid rgba(239, 68, 68, 0.35)',
  color: 'var(--impostor)',
}
