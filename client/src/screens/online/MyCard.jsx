import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneScreen from '../../components/PhoneScreen.jsx'
import RoleCard from '../../components/RoleCard.jsx'
import AlibiCard from '../../components/AlibiCard.jsx'
import Badge from '../../components/Badge.jsx'
import CardSlamFlip from '../../components/CardSlamFlip.jsx'
import { OnlineVoiceMobilePanel, OnlineVoicePanel } from '../../components/OnlineVoicePanel.jsx'
import { useOnlineStore } from '../../store/onlineStore.js'
import { useTimer } from '../../hooks/useTimer.js'
import { isAlibiGame } from '../../utils/gameTypes.js'
import { sfx } from '../../utils/sfx.js'

const TOTAL = 8

export default function MyCard() {
  const navigate = useNavigate()
  const myRole = useOnlineStore(s => s.myRole)
  const myWord = useOnlineStore(s => s.myWord)
  const myClue = useOnlineStore(s => s.myClue)
  const myAlibi = useOnlineStore(s => s.myAlibi)
  const myImpostorTeammates = useOnlineStore(s => s.myImpostorTeammates)
  const config = useOnlineStore(s => s.config)
  const players = useOnlineStore(s => s.players)
  const phase = useOnlineStore(s => s.phase)
  const cardReady = useOnlineStore(s => s.cardReady)
  const myId = useOnlineStore(s => s.myId)
  const [readyClicked, setReadyClicked] = useState(false)
  const { seconds } = useTimer(TOTAL, { autoStart: true })
  const isAlibiMode = isAlibiGame(config)

  useEffect(() => {
    if (phase === 'caseIntro') navigate('/online/alibi-case')
    if (phase === 'discussion') navigate('/online/discussion')
    if (phase === 'voting') navigate('/online/vote')
    if (phase === 'roundResult') navigate('/online/alibi-result')
    if (phase === 'ended') navigate('/online/end')
    if (phase === 'spectator') navigate('/online/spectator')
  }, [phase, navigate])

  useEffect(() => {
    if (!myRole) return
    if (isAlibiMode) sfx.unlock()
    else sfx.revealRole(myRole, { concealBlind: true })
  }, [isAlibiMode, myRole])

  if (!myRole) {
    return (
      <PhoneScreen
        className="online-voice-screen online-card-screen"
        rightPanel={<OnlineVoicePanel />}
      >
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          Esperando carta del servidor...
        </div>
        <OnlineVoiceMobilePanel />
      </PhoneScreen>
    )
  }

  const readyCount = players.filter(p => p.ready).length
  const total = players.length
  const me = players.find(p => p.id === myId)

  return (
    <PhoneScreen
      className="online-voice-screen online-card-screen"
      rightPanel={<OnlineVoicePanel />}
      footer={
        <button
          className="btn btn-secondary"
          disabled={readyClicked}
          onClick={() => { cardReady(); setReadyClicked(true) }}
          style={{ padding: '16px 20px', letterSpacing: '0.22em' }}
        >
          {readyClicked
            ? `Esperando al resto (${readyCount}/${total})`
            : isAlibiMode ? 'He memorizado mi coartada' : 'He memorizado mi carta'}
        </button>
      }
    >
      <div style={{ padding: '0 24px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="t-eyebrow">{isAlibiMode ? 'Tu coartada · confidencial' : 'Tu carta · confidencial'}</span>
        <Badge color="var(--gold)" size="sm">{me?.name || ''}</Badge>
      </div>

      <div style={{ padding: '0 24px' }}>
        <CardSlamFlip backTitle={isAlibiMode ? 'Coartada' : 'Expediente'}>
          {isAlibiMode ? (
            <AlibiCard alibi={myAlibi} seconds={seconds} totalSeconds={TOTAL} />
          ) : (
            <RoleCard
              variant={myRole}
              word={myWord}
              clue={myClue}
              impostorTeammates={myImpostorTeammates}
              seconds={seconds}
              totalSeconds={TOTAL}
            />
          )}
        </CardSlamFlip>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, padding: '0 24px' }}>
        <div style={{
          fontFamily: 'var(--font-type)', fontSize: 10, color: 'var(--text-3)',
          letterSpacing: '0.34em', textTransform: 'uppercase', marginBottom: 4,
        }}>Agentes listos</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26,
          color: 'var(--gold)', letterSpacing: '0.02em',
        }}>{readyCount}<span style={{ color: 'var(--text-faint)', fontSize: 17 }}> / {total}</span></div>
      </div>
      <OnlineVoiceMobilePanel />
    </PhoneScreen>
  )
}
