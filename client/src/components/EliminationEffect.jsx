import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const NORMAL_TIMING = {
  resultMs: 1450,
  completeMs: 2850,
}

const REDUCED_TIMING = {
  resultMs: 250,
  completeMs: 1100,
}

export default function EliminationEffect({ reveal, onComplete }) {
  const reduceMotion = useReducedMotion()
  const [showResult, setShowResult] = useState(false)
  const timing = reduceMotion ? REDUCED_TIMING : NORMAL_TIMING
  const particles = useMemo(() => buildParticles(), [reveal?.id])

  useEffect(() => {
    if (!reveal) return undefined
    setShowResult(false)
    const resultTimer = setTimeout(() => setShowResult(true), timing.resultMs)
    const completeTimer = setTimeout(() => onComplete?.(), timing.completeMs)
    return () => {
      clearTimeout(resultTimer)
      clearTimeout(completeTimer)
    }
  }, [reveal, timing.completeMs, timing.resultMs, onComplete])

  if (!reveal) return null

  const tone = reveal.wasImpostor ? 'victory' : 'error'
  const initial = (reveal.name || '?').trim().charAt(0).toUpperCase()
  const avatar = reveal.avatar || initial

  return (
    <AnimatePresence>
      <motion.div
        key={reveal.id || `${reveal.name}-${reveal.wasImpostor}`}
        className={`elimination-effect elimination-effect--${tone}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.12 : 0.22 }}
        role="alert"
        aria-live="assertive"
      >
        <div className="elimination-effect__grid" />
        {!reduceMotion && (
          <div className="elimination-effect__particles" aria-hidden="true">
            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
                animate={{
                  x: particle.x,
                  y: particle.y,
                  scale: [0.4, particle.scale, 0.2],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  delay: 0.58 + particle.delay,
                  duration: 1.08,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}

        <motion.section
          className="elimination-effect__panel"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 18 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.34, ease: 'easeOut' }}
        >
          <div className="elimination-effect__stamp">Sentencia de la mesa</div>
          <motion.div
            className="elimination-effect__avatar"
            initial={reduceMotion ? { opacity: 1 } : { scale: 0.8, y: -10, rotate: 0 }}
            animate={reduceMotion
              ? { opacity: showResult ? 0.35 : 1 }
              : {
                  scale: [0.8, 1.18, 0.94, 0.7],
                  y: [-10, 0, 18, 74],
                  rotate: [0, -3, 4, -10],
                  opacity: [1, 1, 1, 0.42],
                }}
            transition={{ duration: 1.25, ease: [0.18, 0.8, 0.22, 1] }}
            aria-hidden="true"
          >
            {avatar}
          </motion.div>

          <motion.div
            className="elimination-effect__name"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0.05 : 0.22, duration: 0.22 }}
          >
            {reveal.name || 'Jugador eliminado'}
          </motion.div>

          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.div
                key="result"
                className="elimination-effect__verdict"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: 'easeOut' }}
              >
                <span>{reveal.wasImpostor ? 'Atrapado' : 'Error de la mesa'}</span>
                <strong>{reveal.wasImpostor ? 'Era el impostor' : 'Era ciudadano'}</strong>
                <small>{reveal.wasImpostor ? 'La mesa acierta la sentencia.' : 'La partida continua con un inocente menos.'}</small>
              </motion.div>
            ) : (
              <motion.div
                key="charging"
                className="elimination-effect__charging"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                La acusacion cae sobre la mesa
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}

function buildParticles() {
  return Array.from({ length: 28 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 28
    const distance = 120 + (index % 7) * 18
    return {
      id: index,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * 0.72,
      scale: 0.8 + (index % 5) * 0.18,
      delay: (index % 6) * 0.035,
    }
  })
}
