import { avatarFallbackFor, avatarImageFor, isImageAvatar } from '../data/avatars.js'

export default function PlayerAvatar({ avatar, name, className = '', title, style }) {
  const image = avatarImageFor(avatar)
  const fallback = avatarFallbackFor(avatar, name)
  const classes = ['player-avatar-render', isImageAvatar(avatar) ? 'has-image' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} title={title} style={style}>
      {image ? (
        <img src={image} alt={name ? `Avatar de ${name}` : 'Avatar'} draggable="false" />
      ) : fallback}
    </span>
  )
}
