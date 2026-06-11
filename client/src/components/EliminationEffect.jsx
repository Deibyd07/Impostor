import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import PlayerAvatar from './PlayerAvatar.jsx'
import { sfx } from '../utils/sfx.js'

const NORMAL_TIMING = {
  resultMs: 1500,
  completeMs: 3100,
}

const REDUCED_TIMING = {
  resultMs: 250,
  completeMs: 1100,
}

/**
 * Sentencia de la mesa: la foto del acusado baja colgada de un hilo
 * bajo la lámpara, y el veredicto cae encima como sello de goma.
 */
export default function EliminationEffect({ reveal, onComplete }) {
  const reduceMotion = useReducedMotion()
  const [showResult, setShowResult] = useState(false)
  const timing = reduceMotion ? REDUCED_TIMING : NORMAL_TIMING
  const particles = useMemo(() => buildParticles(), [reveal?.id])

  useEffect(() => {
    if (!reveal) return undefined
    setShowResult(false)
    const resultTimer = setTimeout(() => setShowResult(true), timing.resultMs)
    // el sello visual golpea ~180ms después de aparecer (60% de su animación)
    const stampTimer = setTimeout(() => sfx.stamp(), timing.resultMs + (reduceMotion ? 0 : 180))
    const completeTimer = setTimeout(() => onComplete?.(), timing.completeMs)
    return () => {
      clearTimeout(resultTimer)
      clearTimeout(stampTimer)
      clearTimeout(completeTimer)
    }
  }, [reveal, timing.completeMs, timing.resultMs, onComplete, reduceMotion])

  if (!reveal) return null

  const tone = reveal.wasImpostor ? 'victory' : 'error'

  // portal al body: el overlay no debe quedar atrapado por ancestros con transform
  return createPortal(
    <AnimatePresence>
      <motion.div
        key={reveal.id || `${reveal.name}-${reveal.wasImpostor}`}
        className={`elimination-effect elimination-effect--${tone}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.12 : 0.26 }}
        role="alert"
        aria-live="assertive"
      >
        <div className="elimination-effect__lamp" aria-hidden="true" />

        {!reduceMotion && showResult && (
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
                  delay: particle.delay,
                  duration: 0.95,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}

        <div className="elimination-effect__scene">
          {/* hilo del que cuelga la foto */}
          {!reduceMotion && (
            <motion.span
              className="elimination-effect__thread"
              aria-hidden="true"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.08, ease: 'easeIn' }}
            />
          )}

          {/* sacudida al recibir el sello */}
          <motion.div
            initial={false}
            animate={showResult && !reduceMotion ? { x: [0, -5, 5, -2, 1, 0] } : { x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.div
              className={`elimination-effect__polaroid ${showResult ? 'is-judged' : ''}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -210, rotate: -7 }}
              animate={reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, rotate: [-7, 4, -2.5, 1.5, -1] }}
              transition={reduceMotion
                ? { duration: 0.12 }
                : { duration: 0.95, delay: 0.18, ease: [0.2, 0.85, 0.3, 1] }}
              style={{ transformOrigin: '50% -120px' }}
            >
              <span className="elimination-effect__pin" aria-hidden="true" />
              <div className="elimination-effect__photo">
                <PlayerAvatar
                  avatar={reveal.avatar}
                  name={reveal.name}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div className="elimination-effect__caption">{reveal.name || 'Jugador eliminado'}</div>

              {showResult && (
                <motion.span
                  className="elimination-effect__stamp"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 2.6, rotate: 8 }}
                  animate={reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: [2.6, 0.92, 1.04, 1], rotate: [8, -13, -11.4, -12] }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.34, times: reduceMotion ? undefined : [0, 0.6, 0.84, 1], ease: 'easeIn' }}
                >
                  {reveal.wasImpostor ? 'Impostor' : 'Inocente'}
                </motion.span>
              )}
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.div
                key="result"
                className="elimination-effect__verdict"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.26, delay: 0.18, ease: 'easeOut' }}
              >
                <span>{reveal.wasImpostor ? 'Atrapado' : 'Error de la mesa'}</span>
                <strong>{reveal.wasImpostor ? 'Era el impostor' : 'Era ciudadano'}</strong>
                <small>{reveal.wasImpostor ? 'La mesa acierta la sentencia.' : 'La partida continúa con un inocente menos.'}</small>
              </motion.div>
            ) : (
              <motion.div
                key="charging"
                className="elimination-effect__charging"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.55 }}
              >
                La mesa ha dictado sentencia…
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

function buildParticles() {
  return Array.from({ length: 26 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 26
    const distance = 130 + (index % 7) * 20
    return {
      id: index,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * 0.7,
      scale: 0.8 + (index % 5) * 0.18,
      delay: (index % 6) * 0.03,
    }
  })
}
