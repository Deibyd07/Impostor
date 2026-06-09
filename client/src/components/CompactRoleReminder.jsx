import { useState } from 'react'
import Badge from './Badge.jsx'
import { isDetectiveRole, isImpostorRole } from '../utils/roles.js'

export default function CompactRoleReminder({ role, word, clue }) {
  const [open, setOpen] = useState(false)
  const isImpostor = isImpostorRole(role) && role !== 'impostor-blind'
  const isDetective = isDetectiveRole(role)
  const looksLikeCitizen = role === 'citizen' || role === 'impostor-blind' || role === 'detective'
  const color = isImpostor ? 'var(--impostor)' : isDetective ? 'var(--gold)' : 'var(--citizen)'
  const label = role === 'detective-impostor' ? 'DETECTIVE IMPOSTOR' : isImpostor ? 'IMPOSTOR' : isDetective ? 'DETECTIVE' : 'CIUDADANO'

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        position: 'sticky', top: 0, zIndex: 5,
        margin: '0 -20px', padding: '12px 20px',
        background: 'linear-gradient(180deg, var(--bg-base) 70%, rgba(7,7,15,0.85))',
        borderBottom: '1px solid var(--hairline-cold)',
        cursor: 'pointer',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Badge color={color} dot warn={isImpostor}>{label}</Badge>
        {looksLikeCitizen && word && (
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
            color: 'var(--text-1)', letterSpacing: '0.06em',
            textShadow: '0 0 12px var(--citizen-glow)',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{word.toUpperCase()}</span>
        )}
        {isImpostor && role !== 'impostor-blind' && (
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 12, fontStyle: 'italic',
            color: 'var(--text-2)', flex: 1,
          }}>{role === 'detective-impostor' ? 'Investiga para desviar.' : 'No conoces la palabra.'}</span>
        )}
        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{open ? '△' : '▽'}</span>
      </div>
      {open && (
        <div style={{
          marginTop: 10, fontFamily: 'var(--font-ui)', fontSize: 12,
          color: 'var(--text-2)', lineHeight: 1.4,
        }}>
          {role === 'citizen' && <>Describe la palabra sin decirla. Observa a los demas.</>}
          {role === 'detective' && <>Puedes iniciar un interrogatorio publico una vez por partida.</>}
          {role === 'detective-impostor' && <>Puedes interrogar una vez, pero ganas con los impostores.</>}
          {role === 'impostor' && <>Escucha, se vago, mezcla. Si te descubren, adivina la palabra.</>}
          {role === 'impostor-clue' && (
            <>Tu pista: <strong style={{ color: 'var(--gold-soft)' }}>{clue}</strong></>
          )}
          {role === 'impostor-blind' && <>Crees ser ciudadano, pero tu palabra es falsa.</>}
        </div>
      )}
    </div>
  )
}
