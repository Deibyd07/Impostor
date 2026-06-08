import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WinCitizens from './WinCitizens.jsx'
import WinImpostor from './WinImpostor.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { useStatsStore } from '../../store/statsStore.js'

export default function EndGame() {
  const navigate = useNavigate()
  const session = useGameStore(s => s.session)
  const rematch = useGameStore(s => s.rematch)
  const endSession = useGameStore(s => s.endSession)
  const recordGameResult = useStatsStore(s => s.recordGameResult)

  useEffect(() => {
    if (!session?.winner) return
    recordGameResult({
      gameId: session.id,
      winner: session.winner.winner,
      players: session.players.map(p => ({ name: p.name, role: p.role })),
    })
  }, [session?.id, session?.winner, session?.players, recordGameResult])

  if (!session || !session.winner) { navigate('/'); return null }
  const { winner, reason } = session.winner
  const impostors = session.players.filter(p => p.role === 'impostor')

  const onRematch = () => { rematch(); navigate('/game/pass') }
  const onNew = () => { endSession(); navigate('/setup') }

  if (winner === 'citizens') {
    return (
      <WinCitizens
        impostorName={impostors.map(p => p.name).join(' · ')}
        word={session.word}
        fakeWord={session.fakeWord}
        mode={session.config.mode}
        onRematch={onRematch}
        onNew={onNew}
      />
    )
  }
  return (
    <WinImpostor
      impostorNames={impostors.map(p => p.name)}
      word={session.word}
      reason={reason}
      onRematch={onRematch}
      onNew={onNew}
    />
  )
}
