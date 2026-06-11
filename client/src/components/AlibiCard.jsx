import Badge from './Badge.jsx'
import CircularTimer from './CircularTimer.jsx'

export default function AlibiCard({ alibi, seconds = 8, totalSeconds = 8 }) {
  const isLiar = alibi?.role === 'alibi-liar'
  const isDetective = alibi?.role === 'alibi-detective'
  const displayLocation = alibi?.claimedLocation || 'Sin ubicación'

  if (isDetective) {
    return (
      <article className="alibi-sheet alibi-sheet--detective grain">
        <div className="alibi-sheet__top">
          <Badge color="var(--gold)" dot>DETECTIVE</Badge>
          <CircularTimer seconds={seconds} total={totalSeconds} accent="gold" />
        </div>

        <div className="alibi-sheet__case">
          <span>Expediente</span>
          <strong>{alibi?.title || 'Caso abierto'}</strong>
        </div>

        <div className="alibi-sheet__authority">
          <span>Orden de investigación</span>
          <strong>DIRIGES EL CASO</strong>
          <small>Solo tú puedes emitir la acusación final.</small>
        </div>

        <div className="alibi-sheet__block">
          <span>Tu método</span>
          <p>{alibi?.statement || 'Escucha cada versión y cruza mapa, sonidos y evidencia.'}</p>
        </div>

        <div className="alibi-sheet__block">
          <span>Pista del caso</span>
          <p>{alibi?.clue || 'La mentira suele fallar en una ruta, un sonido o un detalle de visibilidad.'}</p>
        </div>

        <div className="alibi-sheet__objective">
          {alibi?.objective || 'Acusa al sospechoso de la coartada falsa.'}
        </div>

        <span className="alibi-sheet__badge-seal" aria-hidden="true" />
      </article>
    )
  }

  return (
    <article className={`alibi-sheet ${isLiar ? 'alibi-sheet--liar' : 'alibi-sheet--witness'}`}>
      <span className="alibi-sheet__tape" aria-hidden="true" />
      <div className="alibi-sheet__top">
        <Badge color={isLiar ? 'var(--impostor)' : '#41617a'} dot warn={isLiar}>
          {isLiar ? 'COARTADA FALSA' : 'SOSPECHOSO'}
        </Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent={isLiar ? 'impostor' : 'citizen'} />
      </div>

      <div className="alibi-sheet__case">
        <span>Expediente</span>
        <strong>{alibi?.title || 'Caso abierto'}</strong>
      </div>

      <div className="alibi-sheet__location">
        <span>{isLiar ? 'Declara que estabas en' : 'Estabas en'}</span>
        <strong>{displayLocation}</strong>
        {isLiar && alibi?.realLocation && (
          <small>Realmente estabas en <b>{alibi.realLocation}</b></small>
        )}
      </div>

      <div className="alibi-sheet__block">
        <span>Tu versión</span>
        <p>{alibi?.statement || 'Defiende tu lugar en la mesa.'}</p>
      </div>

      {(alibi?.saw || alibi?.heard || alibi?.detail) && (
        <div className="alibi-sheet__intel">
          {alibi?.saw && <p><span>Viste</span>{alibi.saw}</p>}
          {alibi?.heard && <p><span>Oíste</span>{alibi.heard}</p>}
          {alibi?.detail && <p><span>Detalle</span>{alibi.detail}</p>}
        </div>
      )}

      <div className="alibi-sheet__block alibi-sheet__block--clue">
        <span>{isLiar ? 'Consejo de mentira' : 'Pista privada'}</span>
        <p>{alibi?.clue || 'Escucha antes de revelar demasiado.'}</p>
      </div>

      <div className="alibi-sheet__objective">
        {alibi?.objective || (isLiar ? 'Evita que te descubran.' : 'Encuentra la coartada falsa.')}
      </div>

      {isLiar && <span className="alibi-sheet__stamp" aria-hidden="true">FALSA</span>}
    </article>
  )
}
