import { useCallback, useEffect, useRef, useState } from 'react'
import { sanitizeCharacterId } from '../game/characters'
import { isFirebaseConfigured, rtdbListen, rtdbSet, rtdbTransaction } from '../game/rtdb'
import type { RoomSession } from '../game/useGameRoom'
import { makePlayer, sanitizeName } from '../game/protocol'
import {
  addTriviaPlayer,
  applyTriviaMessage,
  emptyTriviaRoom,
  normalizeTriviaRoom,
  playerCount,
  toFirebaseTriviaRoom,
  toTriviaRoomState,
  type StoredTriviaRoom,
} from './roomLogic'
import type { TriviaMessage, TriviaRoomState } from './protocol'

function tabId() {
  const key = 'games-tab-id'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(key, id)
  return id
}

export function useTriviaRoom(session: RoomSession) {
  const [state, setState] = useState<TriviaRoomState | null>(null)
  const configured = isFirebaseConfigured()
  const [error, setError] = useState<string | null>(
    configured ? null : 'Firebase is not configured yet.',
  )
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>(
    configured ? 'connecting' : 'closed',
  )
  const selfId = useRef(tabId())
  const sessionRef = useRef(session)
  const latestState = useRef<TriviaRoomState | null>(null)
  useEffect(() => {
    sessionRef.current = session
  })

  useEffect(() => {
    if (!configured) return

    const code = session.roomCode
    const id = selfId.current
    const name = sanitizeName(session.name)
    const characterId = sanitizeCharacterId(session.characterId) ?? null
    const path = `games/${code}`
    let stopped = false

    const stopListen = rtdbListen(path, (data) => {
      const room = normalizeTriviaRoom(data)
      if (!room) return
      const visible = room.players[id]
        ? room
        : ({
            ...room,
            players: { ...room.players, [id]: makePlayer(id, name, 0, characterId) },
          } satisfies StoredTriviaRoom)
      setError(null)
      latestState.current = toTriviaRoomState(visible, id, code)
      setState(latestState.current)
    })

    void rtdbTransaction(path, (current) => {
      const room = normalizeTriviaRoom(current)
      if (session.intent === 'join') {
        if (!room || playerCount(room) === 0) return undefined
        const next = addTriviaPlayer(room, id, name, characterId)
        return typeof next === 'string' ? undefined : toFirebaseTriviaRoom(next)
      }
      if (room && playerCount(room) > 0) {
        const next = addTriviaPlayer(room, id, name, characterId)
        return typeof next === 'string' ? undefined : toFirebaseTriviaRoom(next)
      }
      return toFirebaseTriviaRoom(emptyTriviaRoom(id, name, characterId))
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
  }, [configured, session.characterId, session.intent, session.name, session.roomCode])

  const send = useCallback((message: TriviaMessage) => {
    if (!isFirebaseConfigured()) return
    const code = sessionRef.current.roomCode
    const id = selfId.current
    const path = `games/${code}`

    void rtdbTransaction(path, (current) => {
      const room = normalizeTriviaRoom(current)
      if (!room) return undefined
      const next = applyTriviaMessage(room, id, message)
      if ('error' in next) return undefined
      return toFirebaseTriviaRoom(next)
    }).then((result) => {
      if (result.committed) {
        const room = normalizeTriviaRoom(result.snapshot)
        if (room) {
          latestState.current = toTriviaRoomState(room, id, code)
          setState(latestState.current)
        }
        return
      }
      const room = normalizeTriviaRoom(result.snapshot)
      if (!room) return
      const next = applyTriviaMessage(room, id, message)
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
