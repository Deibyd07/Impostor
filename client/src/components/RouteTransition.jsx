import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useRoutes } from 'react-router-dom'

const variants = {
  initial: { opacity: 0, y: 8, filter: 'blur(6px)' },
  enter:   { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -6, filter: 'blur(4px)' },
}

const transition = { duration: 0.28, ease: [0.2, 0.7, 0.3, 1] }

export default function RouteTransition({ routes }) {
  const location = useLocation()
  const element = useRoutes(routes, location)
  if (!element) return null
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={transition}
        style={{ minHeight: '100vh' }}
      >
        {element}
      </motion.div>
    </AnimatePresence>
  )
}
