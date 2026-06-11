import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WinCitizens from '../local/WinCitizens.jsx'
import WinImpostor from '../local/WinImpostor.jsx'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import Badge from '../../components/Badge.jsx'
import SectionHeader from '../../components/SectionHeader.jsx'
import { OnlineVoiceMobilePanel, OnlineVoicePanel } from '../../components/OnlineVoicePanel.jsx'
import PlayerAvatar from '../../components/PlayerAvatar.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { isImpostorRole } from '../../utils/roles.js'

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
      <PhoneScreen
        className="online-voice-screen online-end-screen"
        rightPanel={<OnlineVoicePanel />}
      >
        <div style={{ padding: 40, color: 'var(--text-2)', textAlign: 'center' }}>
          Esperando resultados…
        </div>
        <OnlineVoiceMobilePanel />
      </PhoneScreen>
    )
  }

  const impostorPlayers = result.players
    .filter(p => isImpostorRole(p.role))
    .map(p => ({ id: p.id, name: p.name, avatar: p.avatar }))
  const impostorNames = impostorPlayers.map(p => p.name)

  const onRematch = () => {
    if (isHost) rematch()
  }
  const onExit = () => { leaveRoom(); navigate('/') }

  if (result.mode === 'alibi') {
    return (
      <AlibiFinal
        result={result}
        isHost={isHost}
        onRematch={onRematch}
        onExit={onExit}
      />
    )
  }

  if (result.mode === 'partyline') {
    return (
      <PartyLineFinal
        result={result}
        isHost={isHost}
        onRematch={onRematch}
        onExit={onExit}
      />
    )
  }

  if (result.winner === 'citizens') {
    return (
      <WinCitizens
        impostorName={impostorNames.join(' · ')}
        impostorPlayers={impostorPlayers}
        word={result.word}
        fakeWord={result.fakeWord}
        mode={result.fakeWord ? 'blind' : 'classic'}
        rematchLabel={isHost ? 'Revancha' : 'Esperando al anfitrión…'}
        rematchDisabled={!isHost}
        onRematch={onRematch}
        onNew={onExit}
        newLabel="Salir de la sala"
        scoreSummary={result.scoreSummary}
        scoreSyncKey={result.gameId}
        className="online-voice-screen online-end-screen"
        rightPanel={<OnlineVoicePanel />}
        afterScoreboard={<OnlineVoiceMobilePanel />}
      />
    )
  }
  return (
    <WinImpostor
      impostorNames={impostorNames}
      impostorPlayers={impostorPlayers}
      word={result.word}
      reason={result.reason}
      rematchLabel={isHost ? 'Revancha' : 'Esperando al anfitrión…'}
      rematchDisabled={!isHost}
      onRematch={onRematch}
      onNew={onExit}
      newLabel="Salir de la sala"
      scoreSummary={result.scoreSummary}
      scoreSyncKey={result.gameId}
      className="online-voice-screen online-end-screen"
      rightPanel={<OnlineVoicePanel />}
      afterScoreboard={<OnlineVoiceMobilePanel />}
    />
  )
}

function PartyLineFinal({ result, isHost, onRematch, onExit }) {
  const scoreboard = result.partyLineScoreboard || []
  const leader = result.leader || scoreboard[0]

  return (
    <PhoneScreen
      className="online-voice-screen online-end-screen partyline-final-screen"
      footer={
        <div className="end-actions">
          <button className="btn btn-secondary" onClick={onExit}>Salir de la sala</button>
          <button className="btn btn-primary" disabled={!isHost} onClick={onRematch}>
            {isHost ? 'Nueva partida' : 'Esperando al anfitrion...'}
          </button>
        </div>
      }
    >
      <main className="partyline-result partyline-final">
        <header className="partyline-round__hero partyline-result__hero">
          <div>
            <span className="t-eyebrow">Central cerrada</span>
            <h1>{leader ? `${leader.name} controla la linea` : 'Llamadas resueltas'}</h1>
            <p>La partida termino por puntos acumulados en pactos, acusaciones y mentiras sostenidas.</p>
          </div>
          <Badge color="var(--gold)" dot>Linea Privada</Badge>
        </header>

        {result.roundResult && (
          <section className="partyline-result-panel">
            <SectionHeader>Ultima llamada</SectionHeader>
            <div className="partyline-result-list">
              <div>
                <span>EX</span>
                <div>
                  <strong>{result.roundResult.title || result.roundResult.game?.title}</strong>
                  <p>{result.roundResult.summary}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="partyline-result-panel">
          <SectionHeader>Ranking final</SectionHeader>
          <div className="partyline-result-list partyline-score-list">
            {scoreboard.map(item => (
              <div key={item.playerId} className={item.rank === 1 ? 'is-positive' : ''}>
                <span>{item.rank}</span>
                <strong>{item.name}</strong>
                <b>{item.totalPoints}</b>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PhoneScreen>
  )
}

function AlibiFinal({ result, isHost, onRematch, onExit }) {
  const scoreboard = result.alibiScoreboard || []
  const leader = scoreboard[0]

  return (
    <PhoneScreen
      className="online-voice-screen online-end-screen alibi-final-screen"
      rightPanel={<OnlineVoicePanel />}
      footer={
        <div className="end-actions">
          <button className="btn btn-secondary" onClick={onExit}>Salir de la sala</button>
          <button className="btn btn-primary" disabled={!isHost} onClick={onRematch}>
            {isHost ? 'Nueva partida' : 'Esperando al anfitrion...'}
          </button>
        </div>
      }
    >
      <main className="alibi-result alibi-final">
        <header className="alibi-result__hero">
          <span
            className="stamp stamp--xl stamp--green"
            style={{ position: 'absolute', top: 18, right: 16, zIndex: 4 }}
            aria-hidden="true"
          >
            Caso cerrado
          </span>
          <span className="t-eyebrow">Veredicto final</span>
          <h1>{leader ? `${leader.name} domina la mesa` : 'Coartadas resueltas'}</h1>
          <p>La partida terminó por puntos acumulados de acusaciones correctas y mentiras sostenidas.</p>
          <Badge color="var(--gold)" dot>Modo Coartada</Badge>
        </header>

        {result.roundResult && (
          <section className="alibi-result__liar">
            <span>Ultima coartada falsa</span>
            <strong>
              <PlayerAvatar
                avatar={result.roundResult.liar?.avatar}
                name={result.roundResult.liar?.name}
                className="result-inline-avatar"
              />
              {result.roundResult.liar?.name || 'Sin jugador'}
            </strong>
            <p>{result.roundResult.detected ? 'La mesa la descubrio.' : 'La mentira sobrevivio hasta el final.'}</p>
            {result.roundResult.liar?.claimedLocation && result.roundResult.liar?.realLocation && (
              <p>Dijo estar en {result.roundResult.liar.claimedLocation}, pero estaba en {result.roundResult.liar.realLocation}.</p>
            )}
          </section>
        )}

        <section className="alibi-scoreboard">
          <SectionHeader>Ranking final</SectionHeader>
          <div className="alibi-result-list">
            {scoreboard.map(item => (
              <div key={item.playerId} className={item.rank === 1 ? 'is-correct' : ''}>
                <span>{item.rank}</span>
                <strong>{item.name}</strong>
                <b>{item.totalPoints}</b>
              </div>
            ))}
          </div>
        </section>
      </main>
      <OnlineVoiceMobilePanel />
    </PhoneScreen>
  )
}
