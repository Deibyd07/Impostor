import { BrowserRouter, Navigate } from 'react-router-dom'

import Home from './screens/local/Home.jsx'
import HowToPlay from './screens/local/HowToPlay.jsx'
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

const routes = [
  { path: '/', element: <Home /> },
  { path: '/how', element: <HowToPlay /> },
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
  return (
    <div className="app-shell">
      <div className="app-frame">
        <BrowserRouter>
          <RouteTransition routes={routes} />
        </BrowserRouter>
        <ToastHost />
      </div>
    </div>
  )
}
