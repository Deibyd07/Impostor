import Badge from './Badge.jsx'
import CircularTimer from './CircularTimer.jsx'
import MaskIcon from './MaskIcon.jsx'
import GameIcon from './GameIcon.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'

/**
 * RoleCard — variantes:
 *  - 'citizen'         palabra real, ficha de papel
 *  - 'detective'       ciudadano con interrogatorio (papel + latón)
 *  - 'impostor'        carta negra quemada, sello de cera
 *  - 'impostor-clue'   impostor + pista
 *  - 'impostor-blind'  IDÉNTICA visualmente a citizen (palabra falsa)
 *  - 'detective-impostor' impostor con habilidad de interrogatorio
 */
export default function RoleCard({
  variant = 'citizen',
  word = '',
  clue,
  impostorTeammates = [],
  seconds = 8,
  totalSeconds = 8,
}) {
  if (variant === 'citizen' || variant === 'impostor-blind') {
    return <CitizenCard word={word} seconds={seconds} totalSeconds={totalSeconds} />
  }
  if (variant === 'detective') {
    return (
      <CitizenCard
        word={word}
        seconds={seconds}
        totalSeconds={totalSeconds}
        label="DETECTIVE"
        tone="detective"
        timerAccent="gold"
        abilityText="Puedes interrogar públicamente a un jugador durante la discusión."
      />
    )
  }
  if (variant === 'impostor-clue') {
    return <ImpostorCard withClue clue={clue} impostorTeammates={impostorTeammates} seconds={seconds} totalSeconds={totalSeconds} />
  }
  if (variant === 'detective-impostor') {
    return <DetectiveImpostorCard word={word} clue={clue} impostorTeammates={impostorTeammates} seconds={seconds} totalSeconds={totalSeconds} />
  }
  return <ImpostorCard impostorTeammates={impostorTeammates} seconds={seconds} totalSeconds={totalSeconds} />
}

function CitizenCard({
  word,
  seconds,
  totalSeconds,
  label = 'CIUDADANO',
  tone = 'citizen',
  timerAccent = 'citizen',
  abilityText,
}) {
  const displayWord = (word || '—').toUpperCase()
  const sizeClass = displayWord.length > 12 ? 'is-long' : displayWord.length > 8 ? 'is-mid' : ''
  return (
    <div className={`id-card id-card--${tone}`}>
      <span className="id-card__tape" aria-hidden="true" />
      <div className="id-card__top">
        <Badge color={tone === 'detective' ? '#8c5e16' : '#41617a'} dot>{label}</Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent={timerAccent} />
      </div>

      <div className="id-card__label">La palabra secreta</div>
      <div className={`id-card__word ${sizeClass}`}>{displayWord}</div>

      <div className="id-card__thread" aria-hidden="true" />

      {abilityText && (
        <div className="id-card__ability">
          <GameIcon name="shield" size={16} />
          {abilityText}
        </div>
      )}

      <p className="id-card__hint">
        Describe la palabra sin decirla en voz alta.
      </p>

      <span className={`id-card__seal ${tone === 'detective' ? 'id-card__seal--brass' : ''}`} aria-hidden="true">
        {tone === 'detective' ? 'AUTORIDAD' : 'VERIFICADO'}
      </span>
    </div>
  )
}

function ImpostorCard({ withClue = false, clue, impostorTeammates = [], seconds, totalSeconds }) {
  return (
    <div className="id-card id-card--impostor grain grain-heavy">
      <span className="id-card__embers" aria-hidden="true" />
      <div className="id-card__top">
        <Badge color="var(--impostor)" dot warn>IMPOSTOR</Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent="impostor" />
      </div>

      <div className="id-card__mask">
        <MaskIcon size={64} color="#e0584b" />
      </div>

      <div className="id-card__verdict">NO CONOCES<br />LA PALABRA</div>

      <div className="hr-red" style={{ margin: '4px auto 0', width: '62%' }} />

      <p className="id-card__hint id-card__hint--danger">
        Escucha. Mezcla. Sobrevive.<br />
        <span>Si te descubren, ¡adivina la palabra!</span>
      </p>

      {withClue && (
        <div className="id-card__clue">
          <span>Tu pista</span>
          <strong>{clue || '—'}</strong>
        </div>
      )}

      <ImpostorTeammates teammates={impostorTeammates} />

      <span className="id-card__wax" aria-hidden="true">IM</span>
    </div>
  )
}

function DetectiveImpostorCard({ word, clue, impostorTeammates = [], seconds, totalSeconds }) {
  const hasWord = !!word
  const hasClue = !!clue
  return (
    <div className="id-card id-card--impostor id-card--double grain grain-heavy">
      <span className="id-card__embers" aria-hidden="true" />
      <div className="id-card__top">
        <Badge color="var(--gold)" dot warn>DETECTIVE IMPOSTOR</Badge>
        <CircularTimer seconds={seconds} total={totalSeconds} accent="impostor" />
      </div>

      <div className="id-card__mask id-card__mask--brass">
        <MaskIcon size={56} color="#d6a450" />
      </div>

      <div className="id-card__verdict id-card__verdict--brass">INVESTIGAS<br />PARA MENTIR</div>

      <div className="hr-red" style={{ margin: '4px auto 0', width: '62%' }} />

      <div className="id-card__note">
        Eres impostor. Puedes iniciar un interrogatorio una vez y usarlo para sembrar duda.
      </div>

      {(hasClue || hasWord) && (
        <div className="id-card__clue">
          <span>{hasClue ? 'Pista privada' : 'Palabra coartada'}</span>
          <strong>{hasClue ? clue : word}</strong>
        </div>
      )}

      <ImpostorTeammates teammates={impostorTeammates} compact />

      <p className="id-card__hint id-card__hint--danger">
        Pareces una herramienta de la mesa. Usa esa confianza con cuidado.
      </p>

      <span className="id-card__wax id-card__wax--brass" aria-hidden="true">DI</span>
    </div>
  )
}

function ImpostorTeammates({ teammates = [], compact = false }) {
  if (!teammates.length) return null
  return (
    <div className={`id-card__team ${compact ? 'is-compact' : ''}`}>
      <span>Tus cómplices</span>
      <div>
        {teammates.map(teammate => (
          <strong key={teammate.id}>
            <PlayerAvatar avatar={teammate.avatar} name={teammate.name} className="dossier-team-avatar" />
            {teammate.name}
          </strong>
        ))}
      </div>
    </div>
  )
}
