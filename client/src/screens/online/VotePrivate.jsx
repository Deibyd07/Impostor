import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import VoteCard from '../../components/VoteCard.jsx'
import { OnlineVoiceMobilePanel, OnlineVoicePanel } from '../../components/OnlineVoicePanel.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { isAlibiGame } from '../../utils/gameTypes.js'
import { isDetectiveRole } from '../../utils/roles.js'

export default function VotePrivate() {
  const navigate = useNavigate()
  const players = useOnlineStore(s => s.players)
  const myId = useOnlineStore(s => s.myId)
  const phase = useOnlineStore(s => s.phase)
  const votedFor = useOnlineStore(s => s.votedFor)
  const votersReady = useOnlineStore(s => s.votersReady)
  const config = useOnlineStore(s => s.config)
  const myRole = useOnlineStore(s => s.myRole)
  const myAlibi = useOnlineStore(s => s.myAlibi)
  const alibiCase = useOnlineStore(s => s.alibiCase)
  const castVote = useOnlineStore(s => s.castVote)
  const isAlibiMode = isAlibiGame(config)
  const isAlibiDetective = isAlibiMode && (isDetectiveRole(myRole) || myAlibi?.role === 'alibi-detective')

  useEffect(() => {
    if (phase === 'caseIntro') navigate('/online/alibi-case')
    if (phase === 'voted') navigate('/online/vote-sent')
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'roundResult') navigate('/online/alibi-result')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  const detectiveId = alibiCase?.detective?.id || myId
  const activeOthers = players.filter(p => (
    !p.eliminated &&
    !p.disconnected &&
    p.id !== myId &&
    (!isAlibiMode || p.id !== detectiveId)
  ))
  const totalActive = isAlibiMode ? 1 : players.filter(p => !p.eliminated && !p.disconnected).length

  if (isAlibiMode && !isAlibiDetective) {
    return (
      <PhoneScreen
        className="online-voice-screen online-vote-screen"
        rightPanel={<OnlineVoicePanel />}
      >
        <div className="vote-header" style={{ paddingTop: 64 }}>
          <span className="t-eyebrow">Acusación final</span>
          <h1 className="vote-header__title vote-header__title--gold">
            El Detective<br />está decidiendo
          </h1>
          <p className="vote-header__note">
            Mantente en la llamada. La ronda se resolverá cuando el Detective acuse una coartada.
          </p>
        </div>
        <OnlineVoiceMobilePanel />
      </PhoneScreen>
    )
  }

  return (
    <PhoneScreen
      className="online-voice-screen online-vote-screen"
      rightPanel={<OnlineVoicePanel />}
    >
      <div className="vote-header">
        <span className="t-eyebrow">
          {isAlibiMode ? 'Acusación privada' : 'Voto privado'}
        </span>
        <h1 className={`vote-header__title ${isAlibiMode ? 'vote-header__title--gold' : ''}`}>
          {isAlibiMode ? <>Detective,<br />¿a quién acusas?</> : <>¿Quién es<br />el impostor?</>}
        </h1>
        <p className="vote-header__note">
          {isAlibiMode
            ? 'Tu acusación cierra la ronda para toda la mesa.'
            : 'Tu voto es irrevocable y privado.'}
        </p>
      </div>

      <div className="vote-board">
        <div className="vote-board__grid">
          {activeOthers.map(p => (
            <VoteCard
              key={p.id}
              name={p.name}
              avatar={p.avatar}
              votes={0}
              disabled={!!votedFor}
              onClick={() => castVote(p.id)}
            />
          ))}
        </div>
        <div className="vote-board__count">
          {votersReady}<span> / {totalActive} votaron</span>
        </div>
      </div>
      <OnlineVoiceMobilePanel />
    </PhoneScreen>
  )
}
