import Badge from './Badge.jsx'
import CornerOrnament from './CornerOrnament.jsx'
import CircularTimer from './CircularTimer.jsx'
import ParticleField from './ParticleField.jsx'
import MaskIcon from './MaskIcon.jsx'

/**
 * RoleCard — 4 variantes:
 *  - 'citizen'         palabra real, glow azul
 *  - 'impostor'        clásico, glow rojo, máscara, sin palabra
 *  - 'impostor-clue'   impostor + sección dorada con pista
 *  - 'impostor-blind'  IDÉNTICA visualmente a citizen (palabra falsa)
 */
export default function RoleCard({
  variant = 'citizen',
  word = '',
  clue,
  seconds = 8,
  totalSeconds = 8,
}) {
  if (variant === 'citizen' || variant === 'impostor-blind') {
    return <CitizenCard word={word} seconds={seconds} totalSeconds={totalSeconds} />
  }
  if (variant === 'impostor-clue') {
    return <ImpostorCard withClue clue={clue} seconds={seconds} totalSeconds={totalSeconds} />
  }
  return <ImpostorCard seconds={seconds} totalSeconds={totalSeconds} />
}

function CitizenCard({ word, seconds, totalSeconds }) {
  const displayWord = (word || '—').toUpperCase()
  return (
    <div className="grain" style={{
      position: 'relative',
      width: '100%',
      borderRadius: 24,
      padding: '24px 22px 28px',
      background:
        'radial-gradient(120% 90% at 50% 0%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.04) 35%, transparent 70%),' +
        'linear-gradient(180deg, #11142a 0%, #0a0d1d 100%)',
      boxShadow: 'var(--sh-citizen)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
        padding: 1,
        background: 'linear-gradient(180deg, rgba(96,165,250,0.9), rgba(59,130,246,0.4) 40%, rgba(30,64,175,0.6) 100%)',
        WebkitMask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude',
      }} />
      <CornerOrnament color="rgba(96,165,250,0.45)" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <Badge color="var(--citizen)" dot>CIUDADANO</Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent="citizen" />
      </div>

      <div style={{
        marginTop: 38, textAlign: 'center', position: 'relative', zIndex: 2,
        fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 500,
        letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(147, 197, 253, 0.7)',
      }}>La palabra secreta</div>

      <div style={{
        marginTop: 14, textAlign: 'center', position: 'relative', zIndex: 2,
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: displayWord.length > 12 ? 32 : displayWord.length > 8 ? 40 : 52,
        letterSpacing: '0.05em', color: 'var(--text-1)',
        textShadow: '0 2px 24px rgba(59, 130, 246, 0.5), 0 0 1px rgba(255,255,255,0.6)',
        lineHeight: 1,
        wordBreak: 'break-word',
      }}>{displayWord}</div>

      <div style={{ position: 'relative', zIndex: 2, margin: '24px auto 18px', width: '70%' }}>
        <div className="hr-gold" />
        <div style={{
          position: 'absolute', left: '50%', top: -3, transform: 'translateX(-50%)',
          width: 6, height: 6, borderRadius: 999, background: 'var(--gold)',
          boxShadow: '0 0 8px var(--gold)',
        }} />
      </div>

      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 2,
        fontFamily: 'var(--font-ui)', fontSize: 13, fontStyle: 'italic',
        color: 'var(--text-2)', lineHeight: 1.5, padding: '0 8px',
      }}>Describe la palabra<br />sin decirla en voz alta.</div>
    </div>
  )
}

function ImpostorCard({ withClue = false, clue, seconds, totalSeconds }) {
  return (
    <div className="grain grain-heavy" style={{
      position: 'relative',
      width: '100%',
      borderRadius: 24,
      padding: '24px 22px 24px',
      background:
        'radial-gradient(110% 80% at 50% 0%, rgba(220,38,38,0.32) 0%, rgba(220,38,38,0.08) 35%, transparent 70%),' +
        'linear-gradient(180deg, #1a0505 0%, #0d0303 100%)',
      boxShadow: 'var(--sh-impostor)',
      overflow: 'hidden',
    }}>
      <ParticleField />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
        padding: 1,
        background: 'linear-gradient(180deg, rgba(248,113,113,0.9), rgba(220,38,38,0.5) 40%, rgba(127,29,29,0.7) 100%)',
        WebkitMask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude',
      }} />
      <CornerOrnament color="rgba(248, 113, 113, 0.45)" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <Badge color="var(--impostor)" dot warn>IMPOSTOR</Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent="impostor" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, position: 'relative', zIndex: 2 }}>
        <div style={{ filter: 'drop-shadow(0 0 24px rgba(220, 38, 38, 0.7))', color: '#ef4444' }}>
          <MaskIcon size={68} color="#ef4444" />
        </div>
      </div>

      <div style={{
        marginTop: 14, textAlign: 'center', position: 'relative', zIndex: 2,
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24,
        letterSpacing: '0.05em', lineHeight: 1.1,
        color: '#fecaca',
        textShadow: '0 2px 20px rgba(220, 38, 38, 0.6)',
      }}>NO CONOCES<br />LA PALABRA</div>

      <div className="hr-red" style={{ margin: '18px auto', width: '60%' }} />

      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 2,
        fontFamily: 'var(--font-ui)', fontSize: 12, fontStyle: 'italic',
        color: 'rgba(252, 165, 165, 0.85)', lineHeight: 1.5, padding: '0 4px',
      }}>Escucha. Mezcla. Sobrevive.<br />
        <span style={{ color: 'var(--text-2)', fontStyle: 'normal', fontSize: 11, letterSpacing: '0.05em' }}>
          Si te descubren, ¡adivina la palabra!
        </span>
      </div>

      {withClue && (
        <div style={{
          marginTop: 18, position: 'relative', zIndex: 2,
          padding: '14px 14px 12px',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 12,
          boxShadow: 'inset 0 0 18px rgba(245, 158, 11, 0.1)',
          animation: 'clueUnlock 0.6s ease both 1s',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.32em', color: 'var(--gold)', textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold))' }} />
            TU PISTA
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 16, textAlign: 'center', color: 'var(--gold-soft)',
            lineHeight: 1.3,
            textShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
          }}>{clue || '—'}</div>
        </div>
      )}
    </div>
  )
}
