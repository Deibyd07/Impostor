import { useEffect } from 'react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import MaskIcon from '../../components/MaskIcon.jsx'
import { sfx } from '../../utils/sfx.js'

export default function WinImpostor({
  impostorNames = [], word, reason,
  onRematch, onNew,
  rematchLabel = 'Revancha', newLabel = 'Nueva partida',
  rematchDisabled = false,
}) {
  useEffect(() => { sfx.winImpostor() }, [])
  const single = impostorNames.length === 1
  return (
    <PhoneScreen padTop={false} padBottom={false}>
      <div style={{ position: 'absolute', inset: 0,
        background:
          'radial-gradient(80% 60% at 50% 30%, rgba(220, 38, 38, 0.4) 0%, transparent 65%),' +
          'linear-gradient(180deg, #1a0505, var(--bg-base))',
      }} />
      <div className="grain grain-heavy" style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)',
        mixBlendMode: 'overlay',
      }} />

      <div style={{
        position: 'relative', zIndex: 3, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        padding: '88px 28px 36px', alignItems: 'center',
      }}>
        <div className="t-eyebrow" style={{ color: 'var(--impostor)', marginBottom: 10 }}>Final · Victoria</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44,
          letterSpacing: '0.05em', textAlign: 'center', lineHeight: 0.95,
          color: 'var(--text-1)', position: 'relative',
          textShadow: '0 0 36px rgba(220, 38, 38, 0.7), 2px 0 0 rgba(220, 38, 38, 0.5), -2px 0 0 rgba(59, 130, 246, 0.4)',
        }}>{single ? 'EL IMPOSTOR' : 'LOS IMPOSTORES'}<br />GANÓ{single ? '' : 'N'}</div>

        <div style={{ marginTop: 38, filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.6))' }}>
          <MaskIcon size={120} color="#ef4444" />
        </div>

        <div style={{
          marginTop: 24, fontFamily: 'var(--font-ui)', fontSize: 11,
          color: 'rgba(252, 165, 165, 0.6)', letterSpacing: '0.32em',
          textTransform: 'uppercase',
        }}>{reason === 'wordGuessed' ? 'Adivinó la palabra' : 'Identidad protegida'}</div>
        <div style={{
          marginTop: 8, fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 26, color: 'var(--text-1)', letterSpacing: '0.06em', textAlign: 'center',
          textShadow: '0 0 20px var(--impostor-glow)',
        }}>{impostorNames.map(n => n.toUpperCase()).join(' · ')}</div>

        <div className="hr-red" style={{ width: 80, margin: '20px auto 18px' }} />

        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-2)',
          textAlign: 'center', fontStyle: 'italic',
        }}>
          La palabra era&nbsp;
          <span style={{
            fontFamily: 'var(--font-display)', fontStyle: 'normal',
            color: 'var(--gold-soft)', fontWeight: 600, letterSpacing: '0.06em',
          }}>{word}</span>
        </div>

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
