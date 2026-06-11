import { useEffect } from 'react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Confetti from '../../components/Confetti.jsx'
import Badge from '../../components/Badge.jsx'
import RoundScoreboard from '../../components/RoundScoreboard.jsx'
import { sfx } from '../../utils/sfx.js'

export default function WinCitizens({
  impostorName, word, fakeWord, mode,
  onRematch, onNew,
  rematchLabel = 'Revancha', newLabel = 'Nueva partida',
  rematchDisabled = false,
  scoreSummary = null,
  scoreSyncKey = null,
  className = '',
  rightPanel = null,
  afterScoreboard = null,
}) {
  useEffect(() => { sfx.winCitizens() }, [])
  return (
    <PhoneScreen padTop={false} padBottom={false} className={className} rightPanel={rightPanel}>
      <Confetti />
      <div style={{
        position: 'relative', zIndex: 3, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        padding: '90px 28px 36px', alignItems: 'center',
      }}>
        <div className="stamp stamp--green stamp--lg" style={{ marginBottom: 16 }}>Caso cerrado</div>
        <div className="t-eyebrow" style={{ color: 'var(--citizen)', marginBottom: 10, fontSize: 11 }}>
          Victoria · Ciudadanos
        </div>
        <div className="evidence-result-card evidence-result-card--citizens" style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38,
          color: 'var(--text-1)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1,
          textShadow: '0 0 40px var(--victory-glow)',
        }}>¡IMPOSTOR<br />ATRAPADO!</div>

        <div style={{
          marginTop: 36, width: '100%', maxWidth: 320,
          background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
          border: '1px solid var(--hairline-cold)',
          borderRadius: 20, padding: '24px 20px 22px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--gold) 50%, transparent)',
          }} />
          <div style={{
            width: 76, height: 76, borderRadius: 999, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #321114, #240f10)',
            color: 'var(--impostor)',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px -4px var(--impostor-glow), inset 0 0 0 2px var(--impostor)',
          }}>{(impostorName || '?').charAt(0).toUpperCase()}</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22,
            color: 'var(--text-1)', letterSpacing: '0.04em',
          }}>{impostorName}</div>
          <div style={{ marginTop: 10 }}>
            <Badge color="var(--impostor)" warn>ERA EL IMPOSTOR</Badge>
          </div>

          <div className="hr-gold-soft" style={{ margin: '20px 0 16px' }} />

          <div className="t-eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>La palabra secreta era</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30,
            letterSpacing: '0.06em', color: 'var(--gold-soft)',
            textShadow: '0 0 18px var(--gold-glow)',
          }}>{word?.toUpperCase()}</div>

          {mode === 'blind' && fakeWord && (
            <div style={{
              marginTop: 16, padding: '12px 14px',
              background: 'rgba(94, 138, 166, 0.06)',
              border: '1px solid rgba(94, 138, 166, 0.3)',
              borderRadius: 10,
              fontFamily: 'var(--font-ui)', fontSize: 12, lineHeight: 1.5,
              color: 'var(--text-2)', fontStyle: 'italic',
            }}>
              <span style={{ color: 'var(--text-1)', fontStyle: 'normal' }}>{impostorName}</span> creyó
              que la palabra era <span style={{
                fontFamily: 'var(--font-display)', color: 'var(--citizen)',
                fontStyle: 'normal', fontWeight: 600, letterSpacing: '0.08em',
              }}>{fakeWord}</span>… pero era <span style={{
                fontFamily: 'var(--font-display)', color: 'var(--gold)',
                fontStyle: 'normal', fontWeight: 600, letterSpacing: '0.08em',
              }}>{word}</span>.
            </div>
          )}
        </div>

        <RoundScoreboard scoreSummary={scoreSummary} syncKey={scoreSyncKey} />
        {afterScoreboard}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
          <button className="btn btn-primary" onClick={onRematch} disabled={rematchDisabled}
            style={{ padding: '16px', letterSpacing: '0.2em', opacity: rematchDisabled ? 0.55 : 1, cursor: rematchDisabled ? 'wait' : 'pointer' }}>{rematchLabel}</button>
          <button className="btn btn-ghost" onClick={onNew}>{newLabel}</button>
        </div>
      </div>
    </PhoneScreen>
  )
}
