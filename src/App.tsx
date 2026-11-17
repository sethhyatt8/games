import { useEffect, useMemo, useState } from 'react'
import { CueRoomScreen } from './screens/CueRoomScreen'
import { isFirebaseConfigured, rtdbListen } from './game/rtdb'
import { isGameKind, type GameKind } from './game/games'
import { appRootPath, readLocation } from './game/routes'
import { HomeScreen } from './screens/HomeScreen'
import { RoomScreen } from './screens/RoomScreen'
import { TriviaRoomScreen } from './screens/TriviaRoomScreen'
import type { RoomSession } from './game/useGameRoom'
import './App.css'

function readEntry() {
  return readLocation(window.location.href, import.meta.env.BASE_URL)
}

export default function App() {
  const entry = useMemo(() => readEntry(), [])
  const [session, setSession] = useState<RoomSession | null>(null)

  function enter(next: RoomSession) {
    const url = new URL(window.location.href)
    url.pathname = appRootPath(window.location.pathname, import.meta.env.BASE_URL)
    url.search = ''
    url.searchParams.set('room', next.roomCode)
    if (next.gameId) url.searchParams.set('game', next.gameId)
    window.history.replaceState(null, '', url)
    setSession(next)
  }

  function leave() {
    const url = new URL(window.location.href)
    url.pathname = appRootPath(window.location.pathname, import.meta.env.BASE_URL)
    url.search = ''
    window.history.replaceState(null, '', url)
    setSession(null)
  }

  if (!session) {
    return (
      <HomeScreen initialCode={entry.roomCode} initialGame={entry.gameId} onEnter={enter} />
    )
  }

  return <RoomGate session={session} onLeave={leave} />
}

function RoomGate({ session, onLeave }: { session: RoomSession; onLeave: () => void }) {
  const [heard, setHeard] = useState<GameKind | null>(null)
  const kind = session.gameId ?? (isFirebaseConfigured() ? heard : 'steven')

  useEffect(() => {
    if (session.gameId || !isFirebaseConfigured()) return
    return rtdbListen(`games/${session.roomCode}`, (data) => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return
      const gameId = (data as { gameId?: unknown }).gameId
      setHeard(isGameKind(gameId) ? gameId : 'steven')
    })
  }, [session.gameId, session.roomCode])

  if (!kind) {
    return (
      <main className="screen">
        <p className="eyebrow">{session.roomCode}</p>
        <h1>Connecting…</h1>
      </main>
    )
  }

  if (kind === 'cue') return <CueRoomScreen session={session} onLeave={onLeave} />
  if (kind === 'trivia') return <TriviaRoomScreen session={session} onLeave={onLeave} />
  return <RoomScreen session={session} onLeave={onLeave} />
}
