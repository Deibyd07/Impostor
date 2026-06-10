import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom'

import Home from './screens/local/Home.jsx'
import HowToPlay from './screens/local/HowToPlay.jsx'
import PatchNotes from './screens/local/PatchNotes.jsx'
import Profile from './screens/local/Profile.jsx'
import Ranking from './screens/local/Ranking.jsx'
import Setup from './screens/local/Setup.jsx'
import PassPhone from './screens/local/PassPhone.jsx'
import CardReveal from './screens/local/CardReveal.jsx'
import CardHidden from './screens/local/CardHidden.jsx'
import GameBoard from './screens/local/GameBoard.jsx'
import Voting from './screens/local/Voting.jsx'
import EndGame from './screens/local/EndGame.jsx'

import HostLobby from './screens/online/HostLobby.jsx'
import JoinLobby from './screens/online/JoinLobby.jsx'
import WaitingLobby from './screens/online/WaitingLobby.jsx'
import MyCard from './screens/online/MyCard.jsx'
import Discussion from './screens/online/Discussion.jsx'
import VotePrivate from './screens/online/VotePrivate.jsx'
import VoteSent from './screens/online/VoteSent.jsx'
import Spectator from './screens/online/Spectator.jsx'
import EndOnline from './screens/online/EndOnline.jsx'

import ToastHost from './components/ToastHost.jsx'
import RouteTransition from './components/RouteTransition.jsx'
import PrefsToggle from './components/PrefsToggle.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import EliminationEffect from './components/EliminationEffect.jsx'
import VoiceRoom from './components/VoiceRoom.jsx'
import { useGameStore } from './store/gameStore.js'
import { useOnlineStore } from './store/onlineStore.js'
import { sfx } from './utils/sfx.js'

const SPLASH_SESSION_KEY = 'el-impostor-splash-seen'

const routes = [
  { path: '/', element: <Home /> },
  { path: '/how', element: <HowToPlay /> },
  { path: '/patch-0-2-2', element: <PatchNotes /> },
  { path: '/patch-0-2-1', element: <PatchNotes /> },
  { path: '/patch-0-2-0', element: <PatchNotes /> },
  { path: '/patch-0-1-0', element: <PatchNotes /> },
  { path: '/patch-0-0-5', element: <PatchNotes /> },
  { path: '/patch-0-0-4', element: <PatchNotes /> },
  { path: '/patch-0-0-3', element: <PatchNotes /> },
  { path: '/profile', element: <Profile /> },
  { path: '/ranking', element: <Ranking /> },
  { path: '/setup', element: <Setup /> },
  { path: '/game', element: <GameBoard /> },
  { path: '/game/pass', element: <PassPhone /> },
  { path: '/game/reveal', element: <CardReveal /> },
  { path: '/game/hidden', element: <CardHidden /> },
  { path: '/game/vote', element: <Voting /> },
  { path: '/game/end', element: <EndGame /> },

  { path: '/online/host', element: <HostLobby /> },
  { path: '/online/join', element: <JoinLobby /> },
  { path: '/online/waiting', element: <WaitingLobby /> },
  { path: '/online/card', element: <MyCard /> },
  { path: '/online/discussion', element: <Discussion /> },
  { path: '/online/vote', element: <VotePrivate /> },
  { path: '/online/vote-sent', element: <VoteSent /> },
  { path: '/online/spectator', element: <Spectator /> },
  { path: '/online/end', element: <EndOnline /> },

  { path: '*', element: <Navigate to="/" replace /> },
]

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_SESSION_KEY) !== '1'
    } catch {
      return true
    }
  })

  const closeSplash = () => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1')
    } catch {}
    setShowSplash(false)
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        {showSplash ? (
          <SplashScreen onDone={closeSplash} />
        ) : (
          <>
            <PrefsToggle />
            <BrowserRouter>
              <SoundDirector />
              <OnlineRouteDirector />
              <RouteTransition routes={routes} />
            </BrowserRouter>
            <OnlineEliminationEffectHost />
            <VoiceRoom />
            <ToastHost />
          </>
        )}
      </div>
    </div>
  )
}

function OnlineEliminationEffectHost() {
  const reveal = useOnlineStore(s => s.eliminationReveal)
  const clearReveal = useOnlineStore(s => s.clearEliminationReveal)

  return <EliminationEffect reveal={reveal} onComplete={clearReveal} />
}

function SoundDirector() {
  const { pathname } = useLocation()
  const localPhase = useGameStore(s => s.session?.phase)
  const onlinePhase = useOnlineStore(s => s.phase)
  const detectiveInterrogation = useOnlineStore(s => s.detectiveInterrogation)

  const loop = resolveMusicLoop(pathname, {
    localPhase,
    onlinePhase,
    detectiveInterrogation,
  })

  useEffect(() => {
    if (loop) sfx.music(loop)
    else sfx.stopMusic()
  }, [loop])

  return null
}

function OnlineRouteDirector() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const connect = useOnlineStore(s => s.connect)
  const socket = useOnlineStore(s => s.socket)
  const connected = useOnlineStore(s => s.connected)
  const resumePending = useOnlineStore(s => s.resumePending)
  const roomCode = useOnlineStore(s => s.roomCode)
  const phase = useOnlineStore(s => s.phase)
  const isHost = useOnlineStore(s => s.isHost)

  const isOnlinePath = pathname.startsWith('/online')

  useEffect(() => {
    if (isOnlinePath) connect()
  }, [connect, isOnlinePath])

  useEffect(() => {
    if (!isOnlinePath) return
    if (!socket || (!connected && !roomCode) || resumePending) return

    if (!roomCode) {
      if (pathname === '/online/host' || pathname === '/online/join') return
      navigate('/', { replace: true })
      return
    }

    const target = onlineTargetForPhase({ phase, isHost })
    if (target && pathname !== target) navigate(target, { replace: true })
  }, [connected, isHost, isOnlinePath, navigate, pathname, phase, resumePending, roomCode, socket])

  return null
}

function onlineTargetForPhase({ phase, isHost }) {
  if (phase === 'lobby') return isHost ? '/online/host' : '/online/waiting'
  if (phase === 'reveal') return '/online/card'
  if (phase === 'discussion') return '/online/discussion'
  if (phase === 'voting') return '/online/vote'
  if (phase === 'voted') return '/online/vote-sent'
  if (phase === 'spectator') return '/online/spectator'
  if (phase === 'ended') return '/online/end'
  return null
}

function resolveMusicLoop(pathname, { detectiveInterrogation }) {
  if (['/', '/how', '/patch-0-2-2', '/patch-0-2-1', '/patch-0-2-0', '/patch-0-1-0', '/patch-0-0-5', '/patch-0-0-4', '/patch-0-0-3', '/profile', '/ranking', '/setup', '/online/host', '/online/join', '/online/waiting'].includes(pathname)) {
    return 'lobby'
  }
  if (pathname === '/game' || pathname === '/online/spectator') return 'discussion'
  if (pathname === '/online/discussion') return detectiveInterrogation ? 'interrogation' : 'discussion'
  if (pathname === '/game/vote' || pathname === '/online/vote' || pathname === '/online/vote-sent') return 'voting'
  return null
}
