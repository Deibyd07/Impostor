import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import MaskIcon from './MaskIcon.jsx'
import { sfx } from '../utils/sfx.js'

/**
 * El expediente cae y AZOTA la mesa boca abajo, levanta polvo,
 * y tras un instante se voltea para revelar la carta.
 *
 * - `flip`: con false, solo azota (sin volteo) y muestra el contenido directo.
 * - Movimiento reducido: render directo sin drama.
 */
export default function CardSlamFlip({
  children,
  flip = true,
  backTitle = 'Expediente',
  backNote = 'confidencial · no abrir',
  slamDelay = 0.1,
  flipDelay = 1.15,
}) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return undefined
    const slamTimer = setTimeout(() => sfx.slam(), (slamDelay + 0.3) * 1000)
    const flipTimer = flip ? setTimeout(() => sfx.cardFlip(), flipDelay * 1000) : null
    return () => {
      clearTimeout(slamTimer)
      if (flipTimer) clearTimeout(flipTimer)
    }
  }, [flip, flipDelay, reduce, slamDelay])

  if (reduce) {
    return <div className="slam-stage">{children}</div>
  }

  const impactAt = slamDelay + 0.3

  return (
    <div className="slam-stage">
      {/* sacudida de la mesa entera tras el impacto */}
      <motion.div
        initial={false}
        animate={{ x: [0, 0, -4, 4, -2, 1, 0], y: [0, 0, 2, -2, 1, 0, 0] }}
        transition={{ duration: 0.42, delay: impactAt, ease: 'easeOut' }}
      >
        {/* caída y azote */}
        <motion.div
          className="slam-stage__drop"
          initial={{ opacity: 0, y: -110, scale: 1.45, rotate: -7, filter: 'blur(3px)' }}
          animate={{
            opacity: [0, 1, 1, 1],
            y: [-110, 0, -7, 0],
            scale: [1.45, 1, 1.015, 1],
            rotate: [-7, -0.5, 0.6, 0],
            filter: ['blur(3px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
          }}
          transition={{ duration: 0.62, delay: slamDelay, times: [0, 0.48, 0.74, 1], ease: 'easeIn' }}
        >
          {flip ? (
            <motion.div
              className="slam-flip"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 180 }}
              transition={{ duration: 0.7, delay: flipDelay, ease: [0.45, 0, 0.2, 1] }}
            >
              <div className="slam-flip__face slam-flip__face--back" aria-hidden="true">
                <span className="slam-flip__rivet slam-flip__rivet--tl" />
                <span className="slam-flip__rivet slam-flip__rivet--tr" />
                <span className="slam-flip__rivet slam-flip__rivet--bl" />
                <span className="slam-flip__rivet slam-flip__rivet--br" />
                <span className="slam-flip__seal">
                  <MaskIcon size={30} color="#f3d9cf" />
                </span>
                <strong>{backTitle}</strong>
                <em>{backNote}</em>
                <span className="slam-flip__cord" />
              </div>
              <div className="slam-flip__face slam-flip__face--front">
                {children}
              </div>
            </motion.div>
          ) : (
            children
          )}
        </motion.div>
      </motion.div>

      {/* onda expansiva del golpe */}
      <motion.span
        className="slam-stage__shockwave"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.35 }}
        animate={{ opacity: [0, 0.55, 0], scale: [0.35, 1.25, 1.6] }}
        transition={{ duration: 0.55, delay: impactAt, ease: 'easeOut' }}
      />

      {/* polvo que escapa por los lados */}
      <motion.span
        className="slam-stage__dust slam-stage__dust--l"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.7, 0], x: -64, scale: [0.5, 1.2, 1.5], y: [-2, -14] }}
        transition={{ duration: 0.7, delay: impactAt, ease: 'easeOut' }}
      />
      <motion.span
        className="slam-stage__dust slam-stage__dust--r"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.7, 0], x: 64, scale: [0.5, 1.2, 1.5], y: [-2, -14] }}
        transition={{ duration: 0.7, delay: impactAt + 0.04, ease: 'easeOut' }}
      />
    </div>
  )
}
