import award from '../assets/game/icons/award.png'
import card from '../assets/game/icons/card.png'
import cardTarget from '../assets/game/icons/card_target.png'
import cardsFan from '../assets/game/icons/cards_fan.png'
import cardsSkull from '../assets/game/icons/cards_skull.png'
import cardsStack from '../assets/game/icons/cards_stack.png'
import character from '../assets/game/icons/character.png'
import crown from '../assets/game/icons/crown_a.png'
import lockClosed from '../assets/game/icons/lock_closed.png'
import notepad from '../assets/game/icons/notepad.png'
import shield from '../assets/game/icons/shield.png'
import skull from '../assets/game/icons/skull.png'
import token from '../assets/game/icons/token.png'
import tokens from '../assets/game/icons/tokens.png'

const ICONS = {
  award,
  card,
  cardTarget,
  cardsFan,
  cardsSkull,
  cardsStack,
  character,
  crown,
  lock: lockClosed,
  notepad,
  shield,
  skull,
  token,
  tokens,
}

export default function GameIcon({
  name,
  size = 20,
  label,
  className = '',
  style,
}) {
  const src = ICONS[name] || ICONS.card

  return (
    <span
      className={`game-icon ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        width: size,
        height: size,
        '--game-icon-url': `url("${src}")`,
        ...style,
      }}
    />
  )
}
