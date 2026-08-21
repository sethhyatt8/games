import { useEffect, useMemo, useState } from 'react'
import { normalizeRoomCode } from './game/protocol'
import { HomeScreen } from './screens/HomeScreen'
import { RoomScreen } from './screens/RoomScreen'
import type { RoomSession } from './game/useGameRoom'
import './App.css'

function readRoomFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return normalizeRoomCode(params.get('room'))
}

export default function App() {
  const initialCode = useMemo(() => readRoomFromUrl(), [])
  const [session, setSession] = useState<RoomSession | null>(null)

  useEffect(() => {
    const root = document.getElementById('root')
    root?.classList.toggle('wide', Boolean(session))
    return () => root?.classList.remove('wide')
  }, [session])

  function enter(next: RoomSession) {
    const url = new URL(window.location.href)
    url.searchParams.set('room', next.roomCode)
    window.history.replaceState(null, '', url)
    setSession(next)
  }

  function leave() {
    const url = new URL(window.location.href)
    url.searchParams.delete('room')
    window.history.replaceState(null, '', url)
    setSession(null)
  }

  if (!session) {
    return <HomeScreen initialCode={initialCode} onEnter={enter} />
  }

  return <RoomScreen session={session} onLeave={leave} />
}
