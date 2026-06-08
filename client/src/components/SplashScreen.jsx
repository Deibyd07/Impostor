import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import MaskIcon from './MaskIcon.jsx'

const NORMAL_DURATION_MS = 2600
const REDUCED_DURATION_MS = 650

export default function SplashScreen({ onDone }) {
  const reduceMotion = useReducedMotion()
  const durationMs = reduceMotion ? REDUCED_DURATION_MS : NORMAL_DURATION_MS

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), durationMs)
    return () => clearTimeout(timer)
  }, [durationMs, onDone])

  const container = reduceMotion
    ? { opacity: 1 }
    : {
        opacity: [0, 1, 1, 0],
        transition: { duration: durationMs / 1000, times: [0, 0.18, 0.82, 1], ease: 'easeInOut' },
      }

  return (
    <motion.div
      aria-label="El Impostor"
      role="img"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={container}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2400,
        overflow: 'hidden',
        background:
          'radial-gradient(90% 55% at 50% 28%, rgba(220,38,38,0.24), transparent 62%),' +
          'radial-gradient(90% 45% at 50% 72%, rgba(245,158,11,0.12), transparent 70%),' +
          'linear-gradient(180deg, #04040a 0%, #07070f 58%, #020207 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-1)',
        pointerEvents: 'auto',
      }}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.94, filter: 'blur(6px)' }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: reduceMotion ? 0 : 0.62, delay: 0.14, ease: [0.2, 0.8, 0.25, 1] }}
        style={{
          width: '100%',
          padding: '0 32px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.78, rotate: -5 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: [0.78, 1.08, 1], rotate: [ -5, 2, 0 ] }}
          transition={{ duration: reduceMotion ? 0 : 0.78, delay: 0.22, ease: 'easeOut' }}
          style={{
            width: 114,
            height: 114,
            margin: '0 auto 24px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 38%, rgba(220,38,38,0.24), rgba(0,0,0,0.34) 70%)',
            border: '1px solid rgba(245,158,11,0.38)',
            boxShadow:
              '0 0 0 1px rgba(220,38,38,0.22), 0 0 52px -10px rgba(220,38,38,0.8), inset 0 0 32px rgba(245,158,11,0.08)',
            color: '#ef4444',
          }}
        >
          <MaskIcon size={74} color="#ef4444" />
        </motion.div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 52,
          letterSpacing: '0.04em',
          lineHeight: 0.94,
          textShadow:
            '0 0 52px rgba(220,38,38,0.78), 0 0 22px rgba(220,38,38,0.5), 0 3px 1px rgba(0,0,0,0.9)',
        }}>
          EL<br />IMPOSTOR
        </div>

        <motion.div
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={reduceMotion ? { scaleX: 1, opacity: 0.72 } : { scaleX: [0, 1, 1], opacity: [0, 0.85, 0.55] }}
          transition={{ duration: reduceMotion ? 0 : 0.82, delay: 0.48, ease: 'easeOut' }}
          style={{
            width: 116,
            height: 1,
            margin: '20px auto 14px',
            transformOrigin: 'center',
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          }}
        />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? { opacity: 0.72 } : { opacity: [0, 0.72, 0.72], y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.48, delay: 0.7 }}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--gold)',
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
          }}
        >
          Nadie esta a salvo
        </motion.div>
      </motion.div>

      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '120%', opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.05, delay: 0.42, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: '44%',
            transform: 'skewX(-16deg)',
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.24), transparent)',
            filter: 'blur(1px)',
          }}
        />
      )}
    </motion.div>
  )
}
