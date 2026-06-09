import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WinCitizens from './WinCitizens.jsx'
import WinImpostor from './WinImpostor.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { isImpostorRole } from '../../utils/roles.js'
import { SERVER_URL } from '../../config/server.js'

export default function EndGame() {
  const navigate = useNavigate()
  const session = useGameStore(s => s.session)
  const rematch = useGameStore(s => s.rematch)
  const endSession = useGameStore(s => s.endSession)
  const scoreSummary = useGameStore(s => s.lastScoreSummary)
  const recordRoundScores = useGameStore(s => s.recordRoundScores)
  const recordedRef = useRef(null)
  const [scoreSyncKey, setScoreSyncKey] = useState(null)

  useEffect(() => {
    if (!session?.winner || recordedRef.current === session.id) return
    recordedRef.current = session.id
    recordRoundScores(session)
    fetch(`${SERVER_URL}/match-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: session.id,
        winner: session.winner.winner,
        reason: session.winner.reason,
        mode: session.config?.mode,
        category: session.category || session.config?.category,
        word: session.word,
        fakeWord: session.fakeWord,
        playedAt: Date.now(),
        players: session.players.map(p => ({
          name: p.name,
          avatar: p.avatar,
          role: p.role,
          profileId: p.profileId || null,
          isGuest: p.isGuest !== false || !p.profileId,
        })),
      }),
    })
      .then(() => setScoreSyncKey(Date.now()))
      .catch(error => {
        console.warn(`[leaderboard] No se pudo registrar la partida local: ${error.message}`)
      })
  }, [recordRoundScores, session])

  if (!session || !session.winner) { navigate('/'); return null }
  const { winner, reason } = session.winner
  const impostors = session.players.filter(p => isImpostorRole(p.role))

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
        scoreSummary={scoreSummary}
        scoreSyncKey={scoreSyncKey}
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
      scoreSummary={scoreSummary}
      scoreSyncKey={scoreSyncKey}
    />
  )
}
