import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, useLocation } from 'react-router-dom'

import Home from './screens/local/Home.jsx'
import HowToPlay from './screens/local/HowToPlay.jsx'
import PatchNotes from './screens/local/PatchNotes.jsx'
import Profile from './screens/local/Profile.jsx'
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
  { path: '/patch-1-2-2', element: <PatchNotes /> },
  { path: '/patch-1-2-1', element: <PatchNotes /> },
  { path: '/patch-1-2', element: <PatchNotes /> },
  { path: '/patch-1-1', element: <PatchNotes /> },
  { path: '/profile', element: <Profile /> },
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

function resolveMusicLoop(pathname, { detectiveInterrogation }) {
  if (['/', '/how', '/patch-1-2-2', '/patch-1-2-1', '/patch-1-2', '/patch-1-1', '/profile', '/setup', '/online/host', '/online/join', '/online/waiting'].includes(pathname)) {
    return 'lobby'
  }
  if (pathname === '/game' || pathname === '/online/spectator') return 'discussion'
  if (pathname === '/online/discussion') return detectiveInterrogation ? 'interrogation' : 'discussion'
  if (pathname === '/game/vote' || pathname === '/online/vote' || pathname === '/online/vote-sent') return 'voting'
  return null
}
