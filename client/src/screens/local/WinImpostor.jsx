import { useEffect } from 'react'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import MaskIcon from '../../components/MaskIcon.jsx'
import RoundScoreboard from '../../components/RoundScoreboard.jsx'
import CulpritBoard from '../../components/CulpritBoard.jsx'
import { sfx } from '../../utils/sfx.js'

export default function WinImpostor({
  impostorNames = [], word, reason, impostorPlayers = [],
  onRematch, onNew,
  rematchLabel = 'Revancha', newLabel = 'Nueva partida',
  rematchDisabled = false,
  scoreSummary = null,
  scoreSyncKey = null,
  className = '',
  rightPanel = null,
  afterScoreboard = null,
}) {
  useEffect(() => { sfx.winImpostor() }, [])
  const single = impostorNames.length === 1
  return (
    <PhoneScreen padTop={false} padBottom={false} className={className} rightPanel={rightPanel}>
      <div style={{ position: 'absolute', inset: 0,
        background:
          'radial-gradient(80% 60% at 50% 30%, rgba(207, 59, 52, 0.4) 0%, transparent 65%),' +
          'linear-gradient(180deg, #240f10, var(--bg-base))',
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
        <div className="stamp stamp--lg" style={{ marginBottom: 16 }}>Caso sin resolver</div>
        <div className="t-eyebrow" style={{ color: 'var(--impostor)', marginBottom: 10 }}>Final · Victoria</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44,
          letterSpacing: '0.05em', textAlign: 'center', lineHeight: 0.95,
          color: 'var(--text-1)', position: 'relative',
          textShadow: '0 0 36px rgba(207, 59, 52, 0.7), 2px 0 0 rgba(207, 59, 52, 0.5), -2px 0 0 rgba(94, 138, 166, 0.4)',
        }}>{single ? 'EL IMPOSTOR' : 'LOS IMPOSTORES'}<br />GANÓ{single ? '' : 'N'}</div>

        <div style={{ position: 'relative', marginTop: 30 }}>
          <div style={{
            position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 0 30px rgba(207, 59, 52, 0.7))', opacity: 0.5, zIndex: 0,
          }}>
            <MaskIcon size={150} color="#e0584b" />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CulpritBoard
              players={impostorPlayers.length ? impostorPlayers : impostorNames.map(name => ({ name }))}
              stampText="Intocable"
            />
          </div>
        </div>

        <div style={{
          marginTop: 22, fontFamily: 'var(--font-ui)', fontSize: 11,
          color: 'rgba(252, 165, 165, 0.6)', letterSpacing: '0.32em',
          textTransform: 'uppercase',
        }}>{reason === 'wordGuessed' ? 'Adivinó la palabra' : 'Identidad protegida'}</div>

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
