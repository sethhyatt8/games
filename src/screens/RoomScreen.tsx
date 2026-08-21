import { useEffect, useState } from 'react'
import { GuessMap, type MapPin } from '../components/GuessMap'
import { formatMiles } from '../game/geo'
import {
  GAME_TITLE,
  GUESS_SECONDS_OPTIONS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  type GameSettings,
  type RoomState,
} from '../game/protocol'
import { remainingSeconds } from '../game/roomLogic'
import { useGameRoom, type RoomSession } from '../game/useGameRoom'

type RoomScreenProps = {
  session: RoomSession
  onLeave: () => void
}

export function RoomScreen({ session, onLeave }: RoomScreenProps) {
  const { state, error, status, send, disconnect } = useGameRoom(session)
  const [copied, setCopied] = useState(false)
  const [showBorders, setShowBorders] = useState(
    () => localStorage.getItem('games-country-lines') === '1',
  )

  const isHost = Boolean(state && state.selfId === (state.createdBy ?? state.hostId))
  const seconds = useGuessCountdown(state)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (state?.phase !== 'guessing' || !state.deadlineMs) return
    const deadlineMs = state.deadlineMs
    function maybeEnd() {
      if (Date.now() < deadlineMs - 200) return
      send({ type: 'timesUp' })
    }
    maybeEnd()
    const id = window.setInterval(maybeEnd, 400)
    return () => window.clearInterval(id)
  }, [send, state?.deadlineMs, state?.phase])

  function leave() {
    disconnect()
    onLeave()
  }

  async function copyCode() {
    const code = state?.roomCode ?? session.roomCode
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (error && !state) {
    return (
      <main className="screen">
        <h1>Couldn’t join</h1>
        <p className="lede">{error}</p>
        <button className="btn primary" type="button" onClick={leave}>
          Back home
        </button>
      </main>
    )
  }

  if (!state) {
    return (
      <main className="screen">
        <p className="eyebrow">{session.roomCode}</p>
        <h1>{status === 'closed' ? 'Disconnected' : 'Connecting…'}</h1>
        <p className="lede">
          {status === 'closed'
            ? 'The room database isn’t reachable yet. Add a Firebase URL for this games app, then try again.'
            : 'Finding the others…'}
        </p>
        <button className="btn ghost" type="button" onClick={leave}>
          Cancel
        </button>
      </main>
    )
  }

  if (state.phase === 'lobby') {
    return (
      <main className="screen room">
        <header className="room-header">
          <div>
            <p className="eyebrow">{GAME_TITLE}</p>
            <h1 className="room-code">{state.roomCode}</h1>
          </div>
          <button className="btn ghost compact" type="button" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </header>
        <p className="lede">
          Share that code. Everyone drops a pin on the same place. Closest (fewest miles) wins.
        </p>
        <PlayerList state={state} />
        {isHost ? (
          <HostSettings
            settings={state.settings}
            onChange={(settings) => send({ type: 'settings', settings })}
            onStart={(settings) => send({ type: 'start', settings })}
          />
        ) : (
          <p className="hint">Waiting for the host to start.</p>
        )}
        {error ? <p className="hint">{error}</p> : null}
        <button className="btn ghost leave" type="button" onClick={leave}>
          Leave
        </button>
      </main>
    )
  }

  if (state.phase === 'guessing') {
    const pins: MapPin[] = state.myPin
      ? [{ id: state.selfId, name: 'You', lat: state.myPin.lat, lng: state.myPin.lng, kind: 'self' }]
      : []
    return (
      <main className="screen map-room">
        <header className="map-header">
          <div>
            <p className="eyebrow">
              Round {state.round} of {state.settings.rounds} · {state.place?.category}
            </p>
            <h1>{state.place?.name}</h1>
            <p className="hint">
              Tap the map, then lock your guess. {state.lockedIds.length} of {state.players.length} locked.
            </p>
          </div>
          <p className={seconds <= 8 ? 'timer urgent' : 'timer'}>{seconds}s</p>
        </header>
        <GuessMap
          interactive={!state.myLocked}
          showBorders={showBorders}
          pins={pins}
          onDrop={(lat, lng) => send({ type: 'pin', lat, lng })}
        />
        <div className="map-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showBorders}
              onChange={(event) => {
                setShowBorders(event.target.checked)
                localStorage.setItem('games-country-lines', event.target.checked ? '1' : '0')
              }}
            />
            Country lines
          </label>
          {state.myLocked ? (
            <p className="hint">Guess locked. Waiting on the others or the timer.</p>
          ) : (
            <button
              className="btn primary"
              type="button"
              disabled={!state.myPin}
              onClick={() => send({ type: 'lock' })}
            >
              Lock guess
            </button>
          )}
          <button className="btn ghost compact" type="button" onClick={leave}>
            Leave
          </button>
        </div>
      </main>
    )
  }

  if (state.phase === 'reveal') {
    return (
      <main className="screen map-room">
        <header className="map-header">
          <div>
            <p className="eyebrow">
              {state.place?.name} · Round {state.round} of {state.settings.rounds}
            </p>
            <h1>How far off?</h1>
          </div>
        </header>
        <GuessMap interactive={false} showBorders={showBorders} pins={revealPins(state)} />
        <label className="toggle">
          <input
            type="checkbox"
            checked={showBorders}
            onChange={(event) => {
              setShowBorders(event.target.checked)
              localStorage.setItem('games-country-lines', event.target.checked ? '1' : '0')
            }}
          />
          Country lines
        </label>
        <Leaderboard state={state} />
        {isHost ? (
          <button className="btn primary" type="button" onClick={() => send({ type: 'nextRound' })}>
            {state.round >= state.settings.rounds ? 'See winner' : 'Next place'}
          </button>
        ) : (
          <p className="hint">Waiting for the host to continue.</p>
        )}
      </main>
    )
  }

  return (
    <main className="screen room">
      <p className="eyebrow">{GAME_TITLE}</p>
      <h1>{state.winnerName ? `${state.winnerName} wins` : 'That’s a wrap'}</h1>
      <p className="lede">Lowest total miles across every place takes it.</p>
      <Leaderboard state={state} totals />
      {isHost ? (
        <button className="btn primary" type="button" onClick={() => send({ type: 'backToLobby' })}>
          Back to lobby
        </button>
      ) : null}
      <button className="btn ghost leave" type="button" onClick={leave}>
        Leave
      </button>
    </main>
  )
}

function revealPins(state: RoomState): MapPin[] {
  const pins: MapPin[] = state.pins.map((pin) => ({
    id: pin.playerId,
    name: pin.name,
    lat: pin.lat,
    lng: pin.lng,
    kind: pin.playerId === state.selfId ? 'self' : 'other',
  }))
  if (state.answer) {
    pins.push({
      id: 'answer',
      name: state.place?.name ?? 'Answer',
      lat: state.answer.lat,
      lng: state.answer.lng,
      kind: 'answer',
    })
  }
  return pins
}

function PlayerList({ state }: { state: RoomState }) {
  return (
    <ul className="player-list">
      {state.players.map((player) => (
        <li key={player.id}>
          <span>
            {player.name}
            {player.id === state.selfId ? ' (you)' : ''}
          </span>
          <span className="player-tags">
            {player.id === state.hostId ? <span className="tag">Host</span> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Leaderboard({ state, totals = false }: { state: RoomState; totals?: boolean }) {
  const rows = totals
    ? [...state.players]
        .sort((a, b) => a.score - b.score)
        .map((player, index) => ({
          key: player.id,
          rank: index + 1,
          name: player.name,
          detail: formatMiles(player.score),
          you: player.id === state.selfId,
        }))
    : state.rows.map((row, index) => ({
        key: row.playerId,
        rank: index + 1,
        name: row.name,
        detail: row.miles == null ? 'No pin' : formatMiles(row.miles),
        you: row.playerId === state.selfId,
      }))

  return (
    <ol className="leaderboard">
      {rows.map((row) => (
        <li key={row.key} className={row.you ? 'you' : undefined}>
          <span className="rank">{row.rank}</span>
          <span>{row.name}{row.you ? ' (you)' : ''}</span>
          <strong>{row.detail}</strong>
        </li>
      ))}
    </ol>
  )
}

function HostSettings({
  settings,
  onChange,
  onStart,
}: {
  settings: GameSettings
  onChange: (settings: GameSettings) => void
  onStart: (settings: GameSettings) => void
}) {
  return (
    <section className="panel settings">
      <h2>Host setup</h2>
      <label className="field">
        <span>Guess time</span>
        <div className="choice-row">
          {GUESS_SECONDS_OPTIONS.map((value) => (
            <button
              key={value}
              className={settings.guessSeconds === value ? 'btn primary compact' : 'btn ghost compact'}
              type="button"
              onClick={() => onChange({ ...settings, guessSeconds: value })}
            >
              {value}s
            </button>
          ))}
        </div>
      </label>
      <label className="field">
        <span>Places</span>
        <div className="choice-row">
          {[3, 5, 7, 10].filter((value) => value >= MIN_ROUNDS && value <= MAX_ROUNDS).map((value) => (
            <button
              key={value}
              className={settings.rounds === value ? 'btn primary compact' : 'btn ghost compact'}
              type="button"
              onClick={() => onChange({ ...settings, rounds: value })}
            >
              {value}
            </button>
          ))}
        </div>
      </label>
      <button className="btn primary" type="button" onClick={() => onStart(settings)}>
        Start game
      </button>
    </section>
  )
}

function useGuessCountdown(state: RoomState | null) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!state || state.phase !== 'guessing') {
      setSeconds(0)
      return
    }
    function tick() {
      if (!state) return
      setSeconds(
        remainingSeconds({
          deadlineMs: state.deadlineMs,
          guessSeconds: state.settings.guessSeconds,
        }),
      )
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [state])
  return seconds
}
