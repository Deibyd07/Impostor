import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'

export default function HowToPlay() {
  const navigate = useNavigate()
  return (
    <PhoneScreen
      footer={<button className="btn btn-primary" onClick={() => navigate('/')}>Volver al inicio</button>}
    >
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{
          all: 'unset', cursor: 'pointer', color: 'var(--text-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13,
        }}>← Volver</button>
        <div className="t-eyebrow" style={{ color: 'var(--text-2)' }}>Cómo jugar</div>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ padding: '0 24px', lineHeight: 1.6, color: 'var(--text-1)', fontFamily: 'var(--font-ui)' }}>
        <SectionHeader>Objetivo</SectionHeader>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
          Hay <strong style={{ color: 'var(--citizen)' }}>ciudadanos</strong> que conocen la palabra secreta
          y al menos un <strong style={{ color: 'var(--impostor)' }}>impostor</strong> que no la conoce.
          En turnos, todos describen la palabra sin decirla. Al final, votan para eliminar a quien creen
          que es el impostor.
        </p>

        <div style={{ height: 18 }} />
        <SectionHeader>Modos</SectionHeader>
        <ul style={{ paddingLeft: 18, fontSize: 14, color: 'var(--text-2)' }}>
          <li><strong style={{ color: 'var(--impostor)' }}>Clásico:</strong> el impostor no conoce la palabra.</li>
          <li><strong style={{ color: 'var(--gold)' }}>Con pista:</strong> el impostor recibe una pista para improvisar.</li>
          <li><strong style={{ color: 'var(--citizen)' }}>Ciego:</strong> el impostor cree ser ciudadano y recibe una palabra falsa.</li>
        </ul>

        <div style={{ height: 18 }} />
        <SectionHeader>Cómo ganar</SectionHeader>
        <ul style={{ paddingLeft: 18, fontSize: 14, color: 'var(--text-2)' }}>
          <li><strong style={{ color: 'var(--citizen)' }}>Ciudadanos:</strong> eliminan a todos los impostores.</li>
          <li><strong style={{ color: 'var(--impostor)' }}>Impostor:</strong> quedan tantos impostores como ciudadanos,
            o adivina la palabra antes de ser eliminado (modo clásico).</li>
        </ul>

        <div style={{ height: 18 }} />
        <SectionHeader>Consejos</SectionHeader>
        <ul style={{ paddingLeft: 18, fontSize: 14, color: 'var(--text-2)' }}>
          <li>Como ciudadano: sé específico pero no obvio.</li>
          <li>Como impostor: escucha primero, mezcla después.</li>
          <li>Observa quién es <em>demasiado</em> vago o <em>demasiado</em> exacto.</li>
        </ul>
      </div>
    </PhoneScreen>
  )
}
