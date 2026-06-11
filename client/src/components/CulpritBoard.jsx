import { motion, useReducedMotion } from 'framer-motion'
import PlayerAvatar from './PlayerAvatar.jsx'

/**
 * Las fotos de los culpables, en grande: polaroids que caen colgadas
 * con el sello IMPOSTOR cruzado encima.
 */
export default function CulpritBoard({ players = [], stampText = 'Impostor' }) {
  const reduce = useReducedMotion()
  const list = players.length ? players : [{ name: '?', avatar: null }]

  return (
    <div className={`culprit-board ${list.length > 1 ? 'culprit-board--multi' : ''}`}>
      {list.map((player, index) => (
        <motion.div
          key={player.id || player.name || index}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -150 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce
            ? { duration: 0.15 }
            : { type: 'spring', stiffness: 170, damping: 17, mass: 0.9, delay: 0.25 + index * 0.16 }}
        >
          <div className="culprit-card">
            <span className="culprit-card__pin" aria-hidden="true" />
            <div className="culprit-card__photo">
              <PlayerAvatar avatar={player.avatar} name={player.name} />
            </div>
            <div className="culprit-card__name">{player.name}</div>
            <span className="culprit-card__stamp" aria-hidden="true">{stampText}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
