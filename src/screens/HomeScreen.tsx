import { useMemo, useState } from 'react'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { CHARACTERS, findCharacter } from '../game/characters'
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

const NAME_KEY = 'games-name'
const CHARACTER_KEY = 'games-character-id'

type HomeScreenProps = {
  initialCode?: string
  initialGame?: GameKind | null
  onEnter: (session: RoomSession) => void
}

function savedCharacterId() {
  const own = localStorage.getItem(CHARACTER_KEY)
  const fromArtists = own ? null : localStorage.getItem('artists-character-id')
  return findCharacter(own ?? fromArtists)?.id ?? null
}

export function HomeScreen({ initialCode = '', initialGame = null, onEnter }: HomeScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [code, setCode] = useState(initialCode)
  const [mode, setMode] = useState<'choose' | 'join'>(initialCode ? 'join' : 'choose')
  const [gameId, setGameId] = useState<GameKind>(initialGame ?? 'steven')
  const [characterId, setCharacterId] = useState<string | null>(savedCharacterId)

  const selected = findCharacter(characterId)
  const trimmed = name.replace(/\s+/g, ' ').trim()
  const displayName = sanitizeName(trimmed || selected?.name)
  const cleanedCode = useMemo(() => normalizeRoomCode(code), [code])

  function persistIdentity() {
    localStorage.setItem(NAME_KEY, trimmed || selected?.name || displayName)
    if (selected) localStorage.setItem(CHARACTER_KEY, selected.id)
    else localStorage.removeItem(CHARACTER_KEY)
  }

  function pickCharacter(id: string) {
    const next = findCharacter(id)
    if (!next) return
    const previous = findCharacter(characterId)
    setCharacterId(next.id)
    if (!trimmed || trimmed === previous?.name) setName(next.name)
  }

  function pickGuest() {
    const previous = findCharacter(characterId)
    setCharacterId(null)
    if (trimmed && previous && trimmed === previous.name) setName('')
  }

  function createRoom() {
    persistIdentity()
    onEnter({
      intent: 'create',
      name: displayName,
      roomCode: generateRoomCode(),
      gameId,
      characterId: selected?.id,
    })
  }

  function joinRoom() {
    if (cleanedCode.length !== ROOM_CODE_LENGTH) return
    persistIdentity()
    onEnter({
      intent: 'join',
      name: displayName,
      roomCode: cleanedCode,
      characterId: selected?.id,
    })
  }

  return (
    <main className="screen home">
      <p className="eyebrow">Party rooms</p>
      <h1>Games</h1>
      <p className="lede">Create a room, share a code, play on your own phones.</p>

      <div className="field">
        <span>Who’s playing?</span>
        <div className="character-grid">
          {CHARACTERS.map((character) => (
            <button
              key={character.id}
              className={characterId === character.id ? 'character-pick selected' : 'character-pick'}
              type="button"
              onClick={() => pickCharacter(character.id)}
            >
              <CharacterAvatar characterId={character.id} name={character.name} size={56} />
              <span>{character.name}</span>
            </button>
          ))}
          <button
            className={characterId === null ? 'character-pick selected' : 'character-pick'}
            type="button"
            onClick={pickGuest}
          >
            <CharacterAvatar name={trimmed || 'Guest'} size={56} />
            <span>Guest</span>
          </button>
        </div>
      </div>

      <label className="field">
        <span>Your name</span>
        <input
          autoComplete="nickname"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          placeholder={selected?.name ?? 'Player'}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

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
