import { useMemo, useState } from 'react'
import { GAMES, type GameKind } from '../game/games'
import {
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  ROOM_CODE_LENGTH,
  normalizeRoomCode,
  sanitizeName,
} from '../game/protocol'
import { generateRoomCode } from '../game/roomCode'
import type { RoomSession } from '../game/useGameRoom'

type HomeScreenProps = {
  initialCode?: string
  onEnter: (session: RoomSession) => void
}

export function HomeScreen({ initialCode = '', onEnter }: HomeScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem('games-name') ?? '')
  const [code, setCode] = useState(initialCode)
  const [mode, setMode] = useState<'choose' | 'join'>(initialCode ? 'join' : 'choose')
  const [gameId, setGameId] = useState<GameKind>('steven')

  const cleanedName = useMemo(() => sanitizeName(name), [name])
  const cleanedCode = useMemo(() => normalizeRoomCode(code), [code])

  function persistName() {
    localStorage.setItem('games-name', cleanedName)
  }

  function createRoom() {
    persistName()
    onEnter({
      intent: 'create',
      name: cleanedName,
      roomCode: generateRoomCode(),
      gameId,
    })
  }

  function joinRoom() {
    if (cleanedCode.length !== ROOM_CODE_LENGTH) return
    persistName()
    onEnter({
      intent: 'join',
      name: cleanedName,
      roomCode: cleanedCode,
    })
  }

  return (
    <main className="screen home">
      <p className="eyebrow">Party rooms</p>
      <h1>Games</h1>
      <p className="lede">Create a room, share a code, play on your own phones.</p>

      {mode === 'choose' ? (
        <div className="game-list">
          {GAMES.map((game) => (
            <button
              key={game.id}
              className={game.id === gameId ? 'game-card selected' : 'game-card'}
              type="button"
              onClick={() => setGameId(game.id)}
            >
              <p className="eyebrow">{game.title}</p>
              <p>{game.blurb}</p>
            </button>
          ))}
        </div>
      ) : null}

      <label className="field">
        <span>Your name</span>
        <input
          autoComplete="nickname"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          placeholder="Player"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      {mode === 'choose' ? (
        <div className="actions">
          <button className="btn primary" type="button" onClick={createRoom}>
            Create room
          </button>
          <button className="btn ghost" type="button" onClick={() => setMode('join')}>
            Join with a code
          </button>
        </div>
      ) : (
        <form
          className="join-form"
          onSubmit={(event) => {
            event.preventDefault()
            joinRoom()
          }}
        >
          <label className="field">
            <span>Room code</span>
            <input
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={ROOM_CODE_LENGTH}
              value={code}
              placeholder="K7QM"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </label>
          <div className="actions">
            <button
              className="btn primary"
              type="submit"
              disabled={cleanedCode.length !== ROOM_CODE_LENGTH}
            >
              Join room
            </button>
            <button className="btn ghost" type="button" onClick={() => setMode('choose')}>
              Back
            </button>
          </div>
        </form>
      )}

      <p className="hint">Up to {MAX_PLAYERS} players. No accounts needed.</p>
    </main>
  )
}
