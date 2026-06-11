import { sfx } from '../utils/sfx.js'

export default function ModeCard({ icon, title, description, accent = 'gold', selected, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      className={`mode-card mode-card--${accent} ${selected ? 'is-selected' : ''}`}
      onClick={() => { if (!selected) sfx.stamp(); onClick?.() }}
    >
      <span className="mode-card__icon" aria-hidden="true">{icon}</span>
      <span className="mode-card__title">{title}</span>
      <span className="mode-card__desc">{description}</span>
      <span className="mode-card__mark" aria-hidden="true">En juego</span>
      <span className="mode-card__check" aria-hidden="true">✓</span>
    </button>
  )
}
