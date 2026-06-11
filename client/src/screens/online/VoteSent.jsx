import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import { OnlineVoiceMobilePanel, OnlineVoicePanel } from '../../components/OnlineVoicePanel.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { isAlibiGame } from '../../utils/gameTypes.js'

export default function VoteSent() {
  const navigate = useNavigate()
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const votersReady = useOnlineStore(s => s.votersReady)
  const myId = useOnlineStore(s => s.myId)
  const config = useOnlineStore(s => s.config)
  const isAlibiMode = isAlibiGame(config)

  useEffect(() => {
    if (phase === 'caseIntro') navigate('/online/alibi-case')
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'roundResult') navigate('/online/alibi-result')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  const active = players.filter(p => !p.eliminated && !p.disconnected)
  const totalActive = isAlibiMode ? 1 : active.length

  return (
    <PhoneScreen
      className="online-voice-screen online-vote-screen"
      rightPanel={<OnlineVoicePanel />}
    >
      <div style={{ padding: '60px 24px 24px', textAlign: 'center' }}>
        <div className="vote-sent-seal" style={{
          width: 100, height: 100, borderRadius: 999, margin: '0 auto 22px',
          border: '1px solid var(--victory)',
          background: 'rgba(90, 158, 107, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px -10px var(--victory-glow)',
        }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M11 22 L 19 30 L 33 14" stroke="var(--victory)"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
          color: 'var(--text-1)', letterSpacing: '0.04em', marginBottom: 8,
        }}>{isAlibiMode ? 'Acusacion enviada' : 'Tu voto fue enviado'}</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: 13,
          color: 'var(--text-2)', marginBottom: 24,
        }}>{isAlibiMode ? 'El caso se esta cerrando...' : 'Esperando a que voten los demas...'}</div>

        <div style={{
          fontFamily: 'var(--font-num)', fontSize: 32,
          color: 'var(--gold)', letterSpacing: '0.05em',
        }}>{isAlibiMode ? 1 : votersReady}<span style={{ color: 'var(--text-faint)', fontSize: 18 }}>/{totalActive}</span></div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <SectionHeader>{isAlibiMode ? 'Sospechosos del caso' : 'Estado de la mesa'}</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.map(p => (
            <div key={p.id} className="evidence-row" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background: 'var(--surface-1)',
              border: '1px solid var(--hairline-cold)',
              opacity: p.id === myId ? 1 : 0.85,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 999,
                background: 'linear-gradient(135deg, #3d2a30, #261a1e)',
                color: 'var(--gold)', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{p.name.charAt(0).toUpperCase()}</div>
              <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-1)' }}>
                {p.name}{p.id === myId && <span style={{ color: 'var(--text-3)', fontSize: 11, marginLeft: 8 }}>(tu)</span>}
              </span>
              <span style={{ color: 'var(--text-3)', fontSize: 11, letterSpacing: '0.16em' }}>
                {p.id === myId ? 'OK' : '...'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <OnlineVoiceMobilePanel />
    </PhoneScreen>
  )
}
