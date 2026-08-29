import { useEffect, useRef, useState } from 'react'
import { PlayerRoster } from '../components/PlayerRoster'
import { enableAudio, playTrack, stopPlayback } from '../cue/audio'
import { trackById } from '../cue/catalog'
import {
  CUE_GAME_TITLE,
  GUESS_SECONDS_OPTIONS,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  formatOffset,
  type CueRoomState,
  type CueSettings,
} from '../cue/protocol'
import { remainingSeconds } from '../cue/roomLogic'
import { useCueRoom } from '../cue/useCueRoom'
import type { RoomSession } from '../game/useGameRoom'

type CueRoomScreenProps = {
  session: RoomSession
  onLeave: () => void
}

export function CueRoomScreen({ session, onLeave }: CueRoomScreenProps) {
  const { state, error, status, send, disconnect } = useCueRoom(session)
  const [copied, setCopied] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const timerArmed = useRef(false)
  const seconds = useCueCountdown(state)

  const isHost = Boolean(state && state.selfId === (state.createdBy ?? state.hostId))

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (state?.phase !== 'guessing') {
      timerArmed.current = false
      stopPlayback()
      return
    }
    const deadlineMs = state.deadlineMs
    const guessSeconds = state.settings.guessSeconds
    const id = window.setInterval(() => {
      const remaining = remainingSeconds({ deadlineMs, guessSeconds })
      if (remaining > 1) timerArmed.current = true
      if (!timerArmed.current || remaining > 0) return
      send({ type: 'timesUp' })
    }, 250)
    return () => window.clearInterval(id)
  }, [send, state?.deadlineMs, state?.phase, state?.settings.guessSeconds])

  useEffect(() => {
    if (!state || state.phase !== 'guessing' || !state.startedAtMs || !state.trackId) return
    const track = trackById(state.trackId)
    if (!track || state.previewMs == null) return
    void playTrack({
      track,
      startedAtMs: state.startedAtMs,
      fadeAfterMs: state.previewMs,
    })
    return () => stopPlayback()
  }, [state?.phase, state?.previewMs, state?.startedAtMs, state?.trackId])

  function leave() {
    stopPlayback()
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

  async function turnOnSound() {
    await enableAudio()
    setSoundOn(true)
  }

  function tapCue() {
    if (!state?.startedAtMs || state.myLocked) return
    send({ type: 'guess', ms: Date.now() - state.startedAtMs })
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
            <p className="eyebrow">{CUE_GAME_TITLE}</p>
            <h1 className="room-code">{state.roomCode}</h1>
          </div>
          <button className="btn ghost compact" type="button" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </header>
        <p className="lede">
          You’ll hear the start of a song. It fades out. Tap when you think the cue happens.
        </p>
        <PlayerRoster players={state.players} selfId={state.selfId} hostId={state.hostId} />
        <button className="btn ghost" type="button" onClick={() => void turnOnSound()}>
          {soundOn ? 'Sound is on' : 'Tap to enable sound'}
        </button>
        {isHost ? (
          <HostSettings
            playerCount={state.players.length}
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
    const faded = secondsLeftAfterFade(state)
    return (
      <main className="screen room">
        <header className="room-header">
          <div>
            <p className="eyebrow">
              Round {state.round} of {state.settings.rounds}
            </p>
            <h1>When is {state.cueLabel ?? 'the cue'}?</h1>
            <p className="hint">
              {faded
                ? 'The clip is gone. Keep the song going in your head, then tap.'
                : 'Listen. It will fade out in a moment.'}
            </p>
          </div>
          <p className={seconds <= 8 ? 'timer urgent' : 'timer'}>{seconds}s</p>
        </header>
        <button
          className="cue-hit"
          type="button"
          disabled={state.myLocked}
          onClick={tapCue}
        >
          {state.myGuessMs == null ? 'Tap the cue' : formatGuess(state.myGuessMs)}
        </button>
        {state.myLocked ? (
          <p className="hint">
            Locked. {state.lockedIds.length} of {state.players.length} locked.
          </p>
        ) : (
          <button
            className="btn primary"
            type="button"
            disabled={state.myGuessMs == null}
            onClick={() => send({ type: 'lock' })}
          >
            Lock guess
          </button>
        )}
        <p className="hint">
          {state.lockedIds.length} of {state.players.length} locked.
        </p>
        <button className="btn ghost leave" type="button" onClick={leave}>
          Leave
        </button>
      </main>
    )
  }

  if (state.phase === 'reveal') {
    return (
      <main className="screen room">
        <p className="eyebrow">{state.title ?? 'Reveal'}</p>
        <h1>{state.cueLabel} at {formatGuess(state.cueMs ?? 0)}</h1>
        <ol className="leaderboard">
          {state.rows.map((row, index) => (
            <li key={row.playerId} className={row.playerId === state.selfId ? 'you' : undefined}>
              <span className="rank">{index + 1}</span>
              <span>
                {row.name}
                {row.playerId === state.selfId ? ' (you)' : ''}
              </span>
              <strong>
                {row.errorMs == null ? 'No tap' : formatOffset(row.errorMs)}
              </strong>
            </li>
          ))}
        </ol>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            const track = state.trackId ? trackById(state.trackId) : undefined
            if (!track) return
            void playTrack({
              track,
              startedAtMs: Date.now(),
              fadeAfterMs: 60_000,
              full: true,
            })
          }}
        >
          Play through the cue
        </button>
        {isHost ? (
          <button className="btn primary" type="button" onClick={() => send({ type: 'nextRound' })}>
            {state.round >= state.settings.rounds ? 'See winner' : 'Next track'}
          </button>
        ) : (
          <p className="hint">Waiting for the host to continue.</p>
        )}
      </main>
    )
  }

  return (
    <main className="screen room">
      <p className="eyebrow">{CUE_GAME_TITLE}</p>
      <h1>{state.winnerName ? `${state.winnerName} wins` : 'That’s a wrap'}</h1>
      <p className="lede">Lowest total error wins. Misses count as a minute off.</p>
      <ol className="leaderboard">
        {[...state.players]
          .sort((a, b) => a.score - b.score)
          .map((player, index) => (
            <li key={player.id} className={player.id === state.selfId ? 'you' : undefined}>
              <span className="rank">{index + 1}</span>
              <span>
                {player.name}
                {player.id === state.selfId ? ' (you)' : ''}
              </span>
              <strong>{formatOffset(player.score)}</strong>
            </li>
          ))}
      </ol>
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

function HostSettings({
  playerCount,
  settings,
  onChange,
  onStart,
}: {
  playerCount: number
  settings: CueSettings
  onChange: (settings: CueSettings) => void
  onStart: (settings: CueSettings) => void
}) {
  return (
    <section className="panel settings">
      <h2>Host setup</h2>
      <p className="hint host-player-note">
        {playerCount} of {MAX_PLAYERS} players in the room
        {playerCount < 2 ? ' — solo works too' : ''}
      </p>
      <label className="field">
        <span>Time after the fade</span>
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
        <span>Rounds</span>
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

function formatGuess(ms: number) {
  const seconds = ms / 1000
  return `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)}s`
}

function secondsLeftAfterFade(state: CueRoomState) {
  if (!state.startedAtMs || state.previewMs == null) return false
  return Date.now() >= state.startedAtMs + state.previewMs
}

function useCueCountdown(state: CueRoomState | null) {
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
