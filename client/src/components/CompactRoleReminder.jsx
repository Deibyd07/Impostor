import { useState } from 'react'
import Badge from './Badge.jsx'

export default function CompactRoleReminder({ role, word, clue }) {
  const [open, setOpen] = useState(false)
  const isImpostor = role === 'impostor' || role === 'impostor-clue'
  const looksLikeCitizen = role === 'citizen' || role === 'impostor-blind'
  const color = isImpostor ? 'var(--impostor)' : 'var(--citizen)'
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
        <Badge color={color} dot warn={isImpostor}>{isImpostor ? 'IMPOSTOR' : 'CIUDADANO'}</Badge>
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
          }}>No conoces la palabra.</span>
        )}
        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{open ? '▴' : '▾'}</span>
      </div>
      {open && (
        <div style={{
          marginTop: 10, fontFamily: 'var(--font-ui)', fontSize: 12,
          color: 'var(--text-2)', lineHeight: 1.4,
        }}>
          {looksLikeCitizen && <>Describe la palabra sin decirla. Observa a los demás.</>}
          {role === 'impostor' && <>Escucha, sé vago, mezcla. Si te descubren, ¡adivina la palabra!</>}
          {role === 'impostor-clue' && (
            <>Tu pista: <strong style={{ color: 'var(--gold-soft)' }}>{clue}</strong></>
          )}
        </div>
      )}
    </div>
  )
}
