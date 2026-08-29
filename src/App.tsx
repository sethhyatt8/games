import { useEffect, useMemo, useState } from 'react'
import { CueRoomScreen } from './screens/CueRoomScreen'
import { isFirebaseConfigured, rtdbListen } from './game/rtdb'
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

  return <RoomGate session={session} onLeave={leave} />
}

function RoomGate({ session, onLeave }: { session: RoomSession; onLeave: () => void }) {
  const [kind, setKind] = useState<'steven' | 'cue' | null>(session.gameId ?? null)

  useEffect(() => {
    if (session.gameId) {
      setKind(session.gameId)
      return
    }
    if (!isFirebaseConfigured()) {
      setKind('steven')
      return
    }
    return rtdbListen(`games/${session.roomCode}`, (data) => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return
      const gameId = (data as { gameId?: unknown }).gameId
      setKind(gameId === 'cue' ? 'cue' : 'steven')
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

  if (kind === 'cue') {
    return <CueRoomScreen session={session} onLeave={onLeave} />
  }

  return <RoomScreen session={session} onLeave={onLeave} />
}
