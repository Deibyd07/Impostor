import Badge from './Badge.jsx'
import CornerOrnament from './CornerOrnament.jsx'
import CircularTimer from './CircularTimer.jsx'
import ParticleField from './ParticleField.jsx'
import MaskIcon from './MaskIcon.jsx'
import GameIcon from './GameIcon.jsx'

/**
 * RoleCard — variantes:
 *  - 'citizen'         palabra real, glow azul
 *  - 'detective'       ciudadano con interrogatorio
 *  - 'impostor'        clásico, glow rojo, máscara, sin palabra
 *  - 'impostor-clue'   impostor + sección dorada con pista
 *  - 'impostor-blind'  IDÉNTICA visualmente a citizen (palabra falsa)
 *  - 'detective-impostor' impostor con habilidad de interrogatorio
 */
export default function RoleCard({
  variant = 'citizen',
  word = '',
  clue,
  impostorTeammates = [],
  seconds = 8,
  totalSeconds = 8,
}) {
  if (variant === 'citizen' || variant === 'impostor-blind') {
    return <CitizenCard word={word} seconds={seconds} totalSeconds={totalSeconds} />
  }
  if (variant === 'detective') {
    return (
      <CitizenCard
        word={word}
        seconds={seconds}
        totalSeconds={totalSeconds}
        label="DETECTIVE"
        badgeColor="var(--gold)"
        timerAccent="gold"
        abilityText="Interroga publicamente a un jugador durante la discusion."
      />
    )
  }
  if (variant === 'impostor-clue') {
    return <ImpostorCard withClue clue={clue} impostorTeammates={impostorTeammates} seconds={seconds} totalSeconds={totalSeconds} />
  }
  if (variant === 'detective-impostor') {
    return <DetectiveImpostorCard word={word} clue={clue} impostorTeammates={impostorTeammates} seconds={seconds} totalSeconds={totalSeconds} />
  }
  return <ImpostorCard impostorTeammates={impostorTeammates} seconds={seconds} totalSeconds={totalSeconds} />
}

function CitizenCard({
  word,
  seconds,
  totalSeconds,
  label = 'CIUDADANO',
  badgeColor = 'var(--citizen)',
  timerAccent = 'citizen',
  abilityText,
}) {
  const displayWord = (word || '—').toUpperCase()
  return (
    <div className={`role-card role-card--${timerAccent} grain`} style={{
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
      <GameIcon
        name={timerAccent === 'gold' ? 'notepad' : 'shield'}
        size={92}
        className="role-card__asset role-card__asset--blueprint"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <Badge color={badgeColor} dot>{label}</Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent={timerAccent} />
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

      {abilityText && (
        <div style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: 14,
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid rgba(245, 158, 11, 0.34)',
          background: 'rgba(245, 158, 11, 0.08)',
          color: 'var(--gold-soft)',
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          lineHeight: 1.45,
          textAlign: 'center',
        }}>{abilityText}</div>
      )}

      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 2,
        fontFamily: 'var(--font-ui)', fontSize: 13, fontStyle: 'italic',
        color: 'var(--text-2)', lineHeight: 1.5, padding: '0 8px',
      }}>Describe la palabra<br />sin decirla en voz alta.</div>
    </div>
  )
}

function ImpostorCard({ withClue = false, clue, impostorTeammates = [], seconds, totalSeconds }) {
  return (
    <div className="role-card role-card--impostor grain grain-heavy" style={{
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
      <GameIcon name="cardsSkull" size={96} className="role-card__asset role-card__asset--danger" />

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

      <ImpostorTeammates teammates={impostorTeammates} />
    </div>
  )
}

function DetectiveImpostorCard({ word, clue, impostorTeammates = [], seconds, totalSeconds }) {
  const hasWord = !!word
  const hasClue = !!clue
  return (
    <div className="role-card role-card--detective-impostor grain grain-heavy" style={{
      position: 'relative',
      width: '100%',
      borderRadius: 24,
      padding: '24px 22px 24px',
      background:
        'radial-gradient(120% 90% at 50% 0%, rgba(245,158,11,0.26) 0%, rgba(220,38,38,0.18) 36%, transparent 72%),' +
        'linear-gradient(180deg, #241006 0%, #120407 100%)',
      boxShadow:
        '0 0 0 1px rgba(245, 158, 11, 0.58), 0 0 48px -8px rgba(220, 38, 38, 0.6), 0 24px 70px -18px rgba(0,0,0,0.96)',
      overflow: 'hidden',
    }}>
      <ParticleField />
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'linear-gradient(115deg, transparent 0%, rgba(245,158,11,0.18) 42%, transparent 58%),' +
          'repeating-linear-gradient(90deg, rgba(245,158,11,0.035) 0 1px, transparent 1px 34px)',
        opacity: 0.78,
      }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
        padding: 1,
        background: 'linear-gradient(180deg, rgba(245,158,11,0.95), rgba(220,38,38,0.64) 46%, rgba(127,29,29,0.8) 100%)',
        WebkitMask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude',
      }} />
      <CornerOrnament color="rgba(245, 158, 11, 0.55)" />
      <GameIcon name="lock" size={92} className="role-card__asset role-card__asset--gold" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <Badge color="var(--gold)" dot warn>DETECTIVE IMPOSTOR</Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent="impostor" />
      </div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'grid',
        placeItems: 'center',
        marginTop: 18,
      }}>
        <div style={{
          width: 92,
          height: 92,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid rgba(245, 158, 11, 0.62)',
          background:
            'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.25), transparent 66%),' +
            'rgba(8, 4, 8, 0.78)',
          boxShadow: '0 0 38px -8px var(--impostor-glow), inset 0 0 24px rgba(245,158,11,0.08)',
        }}>
          <MaskIcon size={58} color="#f59e0b" />
        </div>
      </div>

      <div style={{
        marginTop: 16,
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 25,
        letterSpacing: '0.05em',
        lineHeight: 1.05,
        color: '#fde68a',
        textShadow: '0 0 24px rgba(245, 158, 11, 0.55), 0 0 34px rgba(220,38,38,0.35)',
      }}>
        INVESTIGAS<br />PARA MENTIR
      </div>

      <div className="hr-red" style={{ margin: '18px auto', width: '62%' }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'grid',
        gap: 10,
      }}>
        <div style={{
          padding: '12px 13px',
          borderRadius: 12,
          border: '1px solid rgba(248, 113, 113, 0.34)',
          background: 'rgba(220, 38, 38, 0.11)',
          color: '#fecaca',
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          lineHeight: 1.45,
          textAlign: 'center',
        }}>
          Eres impostor. Puedes iniciar un interrogatorio una vez y usarlo para sembrar duda.
        </div>

        {(hasClue || hasWord) && (
          <div style={{
            padding: '13px 14px',
            borderRadius: 12,
            border: '1px solid rgba(245, 158, 11, 0.36)',
            background: 'rgba(245, 158, 11, 0.08)',
            color: 'var(--gold-soft)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: 7,
            }}>{hasClue ? 'Pista privada' : 'Palabra coartada'}</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: hasWord && word.length > 12 ? 20 : 23,
              lineHeight: 1.1,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>{hasClue ? clue : word}</div>
          </div>
        )}

        <ImpostorTeammates teammates={impostorTeammates} compact />

        <div style={{
          color: 'rgba(252, 165, 165, 0.86)',
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          fontStyle: 'italic',
          lineHeight: 1.5,
          textAlign: 'center',
        }}>
          Pareces una herramienta de la mesa. Usa esa confianza con cuidado.
        </div>
      </div>
    </div>
  )
}

function ImpostorTeammates({ teammates = [], compact = false }) {
  if (!teammates.length) return null
  return (
    <div style={{
      marginTop: compact ? 0 : 18,
      position: 'relative',
      zIndex: 2,
      padding: compact ? '12px 13px' : '13px 14px',
      borderRadius: 12,
      border: '1px solid rgba(248, 113, 113, 0.32)',
      background:
        'linear-gradient(135deg, rgba(220, 38, 38, 0.16), rgba(245, 158, 11, 0.05))',
      boxShadow: 'inset 0 0 18px rgba(220, 38, 38, 0.08)',
    }}>
      <div style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        marginBottom: 9,
        textAlign: 'center',
      }}>Tus complices</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: teammates.length > 1 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
        gap: 8,
      }}>
        {teammates.map(teammate => (
          <div key={teammate.id} style={{
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 999,
            border: '1px solid rgba(245, 158, 11, 0.22)',
            background: 'rgba(7, 7, 15, 0.46)',
            color: '#fecaca',
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
          }}>
            <span style={{
              width: 22,
              height: 22,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              borderRadius: 999,
              background: 'rgba(220, 38, 38, 0.18)',
              border: '1px solid rgba(248, 113, 113, 0.28)',
            }}>{teammate.avatar || teammate.name?.trim()?.charAt(0)?.toUpperCase() || '?'}</span>
            <strong style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              font: 'inherit',
            }}>{teammate.name}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
