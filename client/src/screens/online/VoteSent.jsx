import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function VoteSent() {
  const navigate = useNavigate()
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const votersReady = useOnlineStore(s => s.votersReady)
  const votedFor = useOnlineStore(s => s.votedFor)
  const myId = useOnlineStore(s => s.myId)

  useEffect(() => {
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  const active = players.filter(p => !p.eliminated)
  const totalActive = active.length

  return (
    <PhoneScreen>
      <div style={{ padding: '60px 24px 24px', textAlign: 'center' }}>
        <div className="vote-sent-seal" style={{
          width: 100, height: 100, borderRadius: 999, margin: '0 auto 22px',
          border: '1px solid var(--victory)',
          background: 'rgba(34, 197, 94, 0.06)',
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
        }}>Tu voto fue enviado</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: 13,
          color: 'var(--text-2)', marginBottom: 24,
        }}>Esperando a que voten los demás…</div>

        <div style={{
          fontFamily: 'var(--font-num)', fontSize: 32,
          color: 'var(--gold)', letterSpacing: '0.05em',
        }}>{votersReady}<span style={{ color: 'var(--text-faint)', fontSize: 18 }}>/{totalActive}</span></div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <SectionHeader>Estado de la mesa</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.map(p => {
            const hasVoted = false /* el servidor no expone quién votó a quién, solo cuántos */
            return (
              <div key={p.id} className="evidence-row" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12,
                background: 'var(--surface-1)',
                border: '1px solid var(--hairline-cold)',
                opacity: p.id === myId ? 1 : 0.85,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 999,
                  background: 'linear-gradient(135deg, #2a2a45, #15152a)',
                  color: 'var(--gold)', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{p.name.charAt(0).toUpperCase()}</div>
                <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-1)' }}>
                  {p.name}{p.id === myId && <span style={{ color: 'var(--text-3)', fontSize: 11, marginLeft: 8 }}>(tú)</span>}
                </span>
                <span style={{ color: 'var(--text-3)', fontSize: 11, letterSpacing: '0.16em' }}>
                  {p.id === myId ? '✓' : '…'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </PhoneScreen>
  )
}
