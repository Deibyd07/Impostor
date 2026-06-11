export default function Stepper({ value, min = 1, max = 99, onChange, accent = 'gold', size = 'md' }) {
  return (
    <div className={`stepper stepper--${accent} ${size === 'lg' ? 'stepper--lg' : ''}`}>
      <button
        type="button"
        className="stepper__btn"
        aria-label="Restar uno"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >−</button>
      <div className="stepper__value">{value}</div>
      <button
        type="button"
        className="stepper__btn"
        aria-label="Sumar uno"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >+</button>
    </div>
  )
}
