import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import MaskIcon from './MaskIcon.jsx'
import { sfx } from '../utils/sfx.js'

const NORMAL_DURATION_MS = 4200
const REDUCED_DURATION_MS = 900
const TAGLINE = 'EL IMPOSTOR · LÍNEA PRIVADA'

/**
 * Intro cinematográfica: la lámpara del despacho parpadea y se enciende,
 * un expediente cae sobre la mesa, el título se estampa con sello de goma,
 * un hilo rojo une dos alfileres y la firma sale a máquina de escribir.
 * Un clic la salta.
 */
export default function SplashScreen({ onDone }) {
  const reduceMotion = useReducedMotion()
  const durationMs = reduceMotion ? REDUCED_DURATION_MS : NORMAL_DURATION_MS
  const [leaving, setLeaving] = useState(false)

  const finish = useMemo(() => {
    let called = false
    return () => {
      if (called) return
      called = true
      onDone?.()
    }
  }, [onDone])

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setLeaving(true)
      sfx.stopTypewriter()
    }, Math.max(0, durationMs - 460))
    const doneTimer = setTimeout(finish, durationMs)
    // sonidos sincronizados con la escena (solo suenan si el navegador ya
    // permitió audio; en la primera visita sin interacción quedan en silencio)
    const soundTimers = reduceMotion ? [] : [
      setTimeout(() => sfx.slam(), 980),
      setTimeout(() => sfx.stamp(), 1440),
      setTimeout(() => sfx.typewriter(), 2500),
    ]
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
      soundTimers.forEach(clearTimeout)
      sfx.stopTypewriter()
    }
  }, [durationMs, finish, reduceMotion])

  const skip = () => {
    sfx.stopTypewriter()
    setLeaving(true)
    setTimeout(finish, 160)
  }

  if (reduceMotion) {
    return (
      <motion.div
        className="splash"
        role="img"
        aria-label="Mesa de Misterio"
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        onClick={skip}
      >
        <div className="splash__lamp is-on" aria-hidden="true" />
        <div className="splash__folder">
          <span className="splash__tape" aria-hidden="true" />
          <div className="splash__case-no">Caso nº MS-01 · confidencial</div>
          <div className="splash__title">MESA DE<br />MISTERIO</div>
          <div className="splash__tagline">{TAGLINE}</div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="splash"
      role="img"
      aria-label="Mesa de Misterio"
      initial={{ opacity: 1 }}
      animate={leaving ? { opacity: 0, scale: 1.045 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.46, ease: [0.5, 0, 0.75, 1] }}
      onClick={skip}
    >
      {/* lámpara que parpadea al encenderse */}
      <motion.div
        className="splash__lamp"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0.12, 0.8, 0.5, 1] }}
        transition={{ duration: 0.85, delay: 0.12, times: [0, 0.25, 0.4, 0.6, 0.75, 1], ease: 'easeOut' }}
      />

      {/* motas de polvo bajo la luz */}
      <div className="splash__dust" aria-hidden="true" />

      {/* el expediente cae sobre la mesa */}
      <motion.div
        className="splash__folder"
        initial={{ opacity: 0, y: -56, rotate: -5, scale: 1.04 }}
        animate={{ opacity: 1, y: 0, rotate: -1.3, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 19, mass: 0.9, delay: 0.62 }}
      >
        <span className="splash__tape" aria-hidden="true" />

        <motion.div
          className="splash__case-no"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.0 }}
        >
          Caso nº MS-01 · confidencial
        </motion.div>

        {/* sello de goma: golpea y rebota */}
        <motion.div
          className="splash__stamp-wrap"
          initial={{ opacity: 0, scale: 2.3, rotate: -10 }}
          animate={{ opacity: 1, scale: [2.3, 0.94, 1.02, 1], rotate: [-10, -1.6, -2.2, -2] }}
          transition={{ duration: 0.5, delay: 1.18, times: [0, 0.55, 0.8, 1], ease: 'easeIn' }}
        >
          <div className="splash__title">MESA DE<br />MISTERIO</div>
          <motion.span
            className="splash__ink-burst"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.4, 1.25, 1.45] }}
            transition={{ duration: 0.55, delay: 1.43 }}
          />
        </motion.div>

        {/* hilo rojo entre dos alfileres */}
        <div className="splash__thread" aria-hidden="true">
          <motion.span
            className="splash__pin splash__pin--l"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [0, 1.35, 1] }}
            transition={{ duration: 0.3, delay: 1.78 }}
          />
          <svg viewBox="0 0 220 22" preserveAspectRatio="none">
            <motion.path
              d="M4 6 C 60 20, 160 20, 216 7"
              fill="none"
              stroke="var(--thread)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.52, delay: 1.92, ease: 'easeInOut' }}
            />
          </svg>
          <motion.span
            className="splash__pin splash__pin--r"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [0, 1.35, 1] }}
            transition={{ duration: 0.3, delay: 2.38 }}
          />
        </div>

        {/* firma a máquina de escribir */}
        <div className="splash__tagline" aria-label={TAGLINE}>
          {TAGLINE.split('').map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.02, delay: 2.5 + index * 0.038 }}
            >
              {char}
            </motion.span>
          ))}
          <motion.i
            className="splash__caret"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0, 1, 0] }}
            transition={{ duration: 1.4, delay: 2.5 + TAGLINE.length * 0.038, repeat: Infinity }}
          />
        </div>

        {/* lacre con la máscara */}
        <motion.div
          className="splash__seal"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.9 }}
          animate={{ opacity: 1, scale: [1.9, 0.92, 1] }}
          transition={{ duration: 0.4, delay: 2.05, times: [0, 0.7, 1], ease: 'easeIn' }}
        >
          <MaskIcon size={30} color="#f3d9cf" />
        </motion.div>
      </motion.div>

      <motion.div
        className="splash__skip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        transition={{ duration: 0.4, delay: 2.9 }}
      >
        tocar para entrar
      </motion.div>
    </motion.div>
  )
}
