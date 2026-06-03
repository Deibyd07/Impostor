import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WinCitizens from '../local/WinCitizens.jsx'
import WinImpostor from '../local/WinImpostor.jsx'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'

export default function EndOnline() {
  const navigate = useNavigate()
  const result = useOnlineStore(s => s.result)
  const phase = useOnlineStore(s => s.phase)
  const isHost = useOnlineStore(s => s.isHost)
  const leaveRoom = useOnlineStore(s => s.leaveRoom)
  const rematch = useOnlineStore(s => s.rematch)

  // Si el host inicia revancha, todos vuelven al lobby (host o waiting según rol)
  useEffect(() => {
    if (phase === 'lobby') {
      navigate(isHost ? '/online/host' : '/online/waiting')
    } else if (phase === 'reveal') {
      navigate('/online/card')
    }
  }, [phase, isHost, navigate])

  if (!result) {
    return (
      <PhoneScreen>
        <div style={{ padding: 40, color: 'var(--text-2)', textAlign: 'center' }}>
          Esperando resultados…
        </div>
      </PhoneScreen>
    )
  }

  const impostorNames = result.players
    .filter(p => p.role === 'impostor')
    .map(p => p.name)

  const onRematch = () => {
    if (isHost) rematch()
  }
  const onExit = () => { leaveRoom(); navigate('/') }

  if (result.winner === 'citizens') {
    return (
      <WinCitizens
        impostorName={impostorNames.join(' · ')}
        word={result.word}
        fakeWord={result.fakeWord}
        mode={result.fakeWord ? 'blind' : 'classic'}
        rematchLabel={isHost ? 'Revancha' : 'Esperando al anfitrión…'}
        rematchDisabled={!isHost}
        onRematch={onRematch}
        onNew={onExit}
        newLabel="Salir de la sala"
      />
    )
  }
  return (
    <WinImpostor
      impostorNames={impostorNames}
      word={result.word}
      reason={result.reason}
      rematchLabel={isHost ? 'Revancha' : 'Esperando al anfitrión…'}
      rematchDisabled={!isHost}
      onRematch={onRematch}
      onNew={onExit}
      newLabel="Salir de la sala"
    />
  )
}
