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
          'radial-gradient(90% 55% at 50% 28%, rgba(207, 59, 52,0.24), transparent 62%),' +
          'radial-gradient(90% 45% at 50% 72%, rgba(214, 164, 80,0.12), transparent 70%),' +
          'linear-gradient(180deg, #0c0709 0%, #160e11 58%, #020207 100%)',
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
            background: 'radial-gradient(circle at 50% 38%, rgba(207, 59, 52,0.24), rgba(0,0,0,0.34) 70%)',
            border: '1px solid rgba(214, 164, 80,0.38)',
            boxShadow:
              '0 0 0 1px rgba(207, 59, 52,0.22), 0 0 52px -10px rgba(207, 59, 52,0.8), inset 0 0 32px rgba(214, 164, 80,0.08)',
            color: '#e0584b',
          }}
        >
          <MaskIcon size={74} color="#e0584b" />
        </motion.div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 50,
          letterSpacing: '0.01em',
          lineHeight: 0.94,
          textShadow:
            '0 0 52px rgba(207, 59, 52,0.78), 0 0 22px rgba(207, 59, 52,0.5), 0 3px 1px rgba(0,0,0,0.9)',
        }}>
          MESA DE<br />MISTERIO
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
          El Impostor · Coartada
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
            background: 'linear-gradient(90deg, transparent, rgba(214, 164, 80,0.24), transparent)',
            filter: 'blur(1px)',
          }}
        />
      )}
    </motion.div>
  )
}
