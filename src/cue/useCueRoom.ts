import { useCallback, useEffect, useRef, useState } from 'react'
import { isFirebaseConfigured, rtdbListen, rtdbSet, rtdbTransaction } from '../game/rtdb'
import type { RoomSession } from '../game/useGameRoom'
import {
  addCuePlayer,
  applyCueMessage,
  emptyCueRoom,
  normalizeCueRoom,
  playerCount,
  playerRecord,
  toCueRoomState,
  toFirebaseCueRoom,
  type StoredCueRoom,
} from './roomLogic'
import { sanitizeName, type CueMessage, type CueRoomState } from './protocol'

function tabId() {
  const key = 'games-tab-id'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(key, id)
  return id
}

export function useCueRoom(session: RoomSession) {
  const [state, setState] = useState<CueRoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')
  const selfId = useRef(tabId())
  const sessionRef = useRef(session)
  const latestState = useRef<CueRoomState | null>(null)
  sessionRef.current = session

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured yet.')
      setStatus('closed')
      return
    }

    const code = session.roomCode
    const id = selfId.current
    const name = sanitizeName(session.name)
    const path = `games/${code}`
    let stopped = false

    const stopListen = rtdbListen(path, (data) => {
      const room = normalizeCueRoom(data)
      if (!room) return
      const visible = room.players[id]
        ? room
        : ({
            ...room,
            players: { ...room.players, [id]: playerRecord(id, name) },
          } satisfies StoredCueRoom)
      setError(null)
      latestState.current = toCueRoomState(visible, id, code)
      setState(latestState.current)
    })

    void rtdbTransaction(path, (current) => {
      const room = normalizeCueRoom(current)
      if (session.intent === 'join') {
        if (!room || playerCount(room) === 0) return undefined
        const next = addCuePlayer(room, id, name)
        return typeof next === 'string' ? undefined : toFirebaseCueRoom(next)
      }
      if (room && playerCount(room) > 0) {
        const next = addCuePlayer(room, id, name)
        return typeof next === 'string' ? undefined : toFirebaseCueRoom(next)
      }
      return toFirebaseCueRoom(emptyCueRoom(id, name))
    })
      .then((result) => {
        if (stopped) return
        if (!result.committed) {
          setError(
            session.intent === 'join'
              ? 'Room not found. Check the code, or create a room.'
              : 'This room is full (6 players).',
          )
          setStatus('closed')
          return
        }
        setStatus('open')
      })
      .catch(() => {
        if (stopped) return
        setError('Could not reach Firebase. Confirm Realtime Database is created.')
        setStatus('closed')
      })

    const heartbeat = window.setInterval(() => {
      void rtdbSet(`${path}/players/${id}/seenAt`, Date.now())
    }, 4000)

    return () => {
      stopped = true
      stopListen()
      window.clearInterval(heartbeat)
      void rtdbSet(`${path}/players/${id}`, null)
    }
  }, [session.intent, session.name, session.roomCode])

  const send = useCallback((message: CueMessage) => {
    if (!isFirebaseConfigured()) return
    const code = sessionRef.current.roomCode
    const id = selfId.current
    const path = `games/${code}`

    if (message.type === 'guess') {
      if (latestState.current?.phase !== 'guessing' || latestState.current.myLocked) return
      void rtdbSet(`${path}/guesses/${id}`, { ms: message.ms, locked: false })
      return
    }

    void rtdbTransaction(path, (current) => {
      const room = normalizeCueRoom(current)
      if (!room) return undefined
      const next = applyCueMessage(room, id, message)
      if ('error' in next) return undefined
      return toFirebaseCueRoom(next)
    }).then((result) => {
      if (result.committed) {
        const room = normalizeCueRoom(result.snapshot)
        if (room) {
          latestState.current = toCueRoomState(room, id, code)
          setState(latestState.current)
        }
        return
      }
      const room = normalizeCueRoom(result.snapshot)
      if (!room) return
      const next = applyCueMessage(room, id, message)
      if ('error' in next) setError(next.error)
    })
  }, [])

  const disconnect = useCallback(() => {
    const code = sessionRef.current.roomCode
    const id = selfId.current
    void rtdbSet(`games/${code}/players/${id}`, null)
  }, [])

  return { state, error, status, send, disconnect }
}
