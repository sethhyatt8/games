import { useEffect, useRef, useState } from 'react'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { PlayerName } from '../components/PlayerName'
import { PlayerRoster } from '../components/PlayerRoster'
import { MAX_PLAYERS } from '../game/protocol'
import type { RoomSession } from '../game/useGameRoom'
import {
  TRIVIA_GAME_TITLE,
  TRIVIA_SECONDS_OPTIONS,
  type TriviaRoomState,
  type TriviaSettings,
} from '../trivia/protocol'
import { remainingSeconds } from '../trivia/roomLogic'
import { TRIVIA_ROUNDS } from '../trivia/rounds'
import { useTriviaRoom } from '../trivia/useTriviaRoom'

type TriviaRoomScreenProps = {
  session: RoomSession
  onLeave: () => void
}

export function TriviaRoomScreen({ session, onLeave }: TriviaRoomScreenProps) {
  const { state, error, status, send, disconnect } = useTriviaRoom(session)
  const [copied, setCopied] = useState(false)
  const timerArmed = useRef(false)
  const seconds = useTriviaCountdown(state)
  const isHost = Boolean(state && state.selfId === (state.createdBy ?? state.hostId))

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (state?.phase !== 'question') {
      timerArmed.current = false
      return
    }
    const deadlineMs = state.deadlineMs
    const guessSeconds = state.settings.seconds
    const id = window.setInterval(() => {
      const remaining = remainingSeconds({ deadlineMs, seconds: guessSeconds })
      if (remaining > 1) timerArmed.current = true
      if (!timerArmed.current || remaining > 0) return
      send({ type: 'timesUp' })
    }, 250)
    return () => window.clearInterval(id)
  }, [send, state?.deadlineMs, state?.phase, state?.settings.seconds])

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
    const picked = state.settings.roundIds
      .map((id) => TRIVIA_ROUNDS.find((round) => round.id === id))
      .filter((round) => round != null)
    return (
      <main className="screen room">
        <header className="room-header">
          <div>
            <p className="eyebrow">{TRIVIA_GAME_TITLE}</p>
            <h1 className="room-code">{state.roomCode}</h1>
          </div>
          <button className="btn ghost compact" type="button" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </header>
        <p className="lede">
          Share that code. The host picks the rounds, then everyone answers on their own phone.
        </p>
        <PlayerRoster players={state.players} selfId={state.selfId} hostId={state.hostId} />
        {isHost ? (
          <HostSettings
            playerCount={state.players.length}
            settings={state.settings}
            onChange={(settings) => send({ type: 'settings', settings })}
            onStart={(settings) => send({ type: 'start', settings })}
          />
        ) : (
          <>
            <p className="hint">Waiting for the host to start.</p>
            <p className="hint">
              {picked.length === 0
                ? 'No rounds picked yet.'
                : `Tonight: ${picked.map((round) => round.title).join(', ')}. ${state.settings.seconds}s each.`}
            </p>
          </>
        )}
        {error ? <p className="hint">{error}</p> : null}
        <button className="btn ghost leave" type="button" onClick={leave}>
          Leave
        </button>
      </main>
    )
  }

  if (state.phase === 'question' && state.question) {
    const question = state.question
    return (
      <main className="screen room">
        <header className="room-header">
          <div>
            <p className="eyebrow">
              {question.roundTitle}
              {question.placeholder ? ' · test' : ''} · {question.questionNumber} of {question.questionCount}
            </p>
            <h1 className="question-prompt">{question.prompt}</h1>
          </div>
          <p className={seconds <= 5 ? 'timer urgent' : 'timer'}>{seconds}s</p>
        </header>
        <AnswerPad state={state} send={send} />
        <p className="hint">
          {state.lockedIds.length} of {state.players.length} locked.
          {state.myLocked ? ' Yours is in.' : ' You can change it until you lock.'}
        </p>
        <button className="btn ghost leave" type="button" onClick={leave}>
          Leave
        </button>
      </main>
    )
  }

  if (state.phase === 'reveal' && state.question) {
    const question = state.question
    const lastInRound = question.questionNumber >= question.questionCount
    const lastRound = question.roundNumber >= question.roundCount
    const nextLabel = !lastInRound ? 'Next question' : !lastRound ? 'Next round' : 'See winner'
    return (
      <main className="screen room">
        <p className="eyebrow">
          {question.roundTitle} · {question.questionNumber} of {question.questionCount}
        </p>
        <h1 className="question-prompt">{state.correctText}</h1>
        <p className="lede">{question.prompt}</p>
        {state.note ? <p className="hint">{state.note}</p> : null}
        <ScoreList state={state} />
        {isHost ? (
          <button className="btn primary" type="button" onClick={() => send({ type: 'next' })}>
            {nextLabel}
          </button>
        ) : (
          <p className="hint">Waiting for the host to continue.</p>
        )}
      </main>
    )
  }

  const winner = state.players.find((player) => state.winnerName?.split(' & ').includes(player.name))
  return (
    <main className="screen room">
      <p className="eyebrow">{TRIVIA_GAME_TITLE}</p>
      {winner ? (
        <CharacterAvatar
          characterId={winner.characterId}
          name={winner.name}
          size={96}
          mood="surprise"
        />
      ) : null}
      <h1>{state.winnerName ? `${state.winnerName} wins` : 'That’s a wrap'}</h1>
      <p className="lede">Highest total score takes it. Ties share the win.</p>
      <ScoreList state={state} totals />
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

function AnswerPad({
  state,
  send,
}: {
  state: TriviaRoomState
  send: (message: Parameters<ReturnType<typeof useTriviaRoom>['send']>[0]) => void
}) {
  const question = state.question
  if (!question) return null
  if (question.kind === 'choice' && question.choices) {
    return (
      <div className="answer-stack">
        {question.choices.map((choice, index) => {
          const selected = state.myAnswer?.kind === 'choice' && state.myAnswer.index === index
          return (
            <button
              key={`${index}-${choice}`}
              className={selected ? 'btn primary' : 'btn ghost'}
              type="button"
              disabled={state.myLocked}
              onClick={() => send({ type: 'answer', answer: { kind: 'choice', index } })}
            >
              {choice}
            </button>
          )
        })}
        <button
          className={
            !state.myLocked && state.myAnswer?.kind === 'choice' ? 'btn primary' : 'btn ghost'
          }
          type="button"
          disabled={state.myLocked || state.myAnswer?.kind !== 'choice'}
          onClick={() => send({ type: 'lock' })}
        >
          {state.myLocked ? 'Locked' : 'Lock answer'}
        </button>
      </div>
    )
  }
  if (question.kind === 'boolean') {
    const value = state.myAnswer?.kind === 'boolean' ? state.myAnswer.value : null
    return (
      <div className="answer-stack">
        <div className="choice-row">
          {[true, false].map((option) => (
            <button
              key={option ? 'true' : 'false'}
              className={value === option ? 'btn primary' : 'btn ghost'}
              type="button"
              disabled={state.myLocked}
              onClick={() => send({ type: 'answer', answer: { kind: 'boolean', value: option } })}
            >
              {option ? 'True' : 'False'}
            </button>
          ))}
        </div>
        <button
          className={!state.myLocked && value != null ? 'btn primary' : 'btn ghost'}
          type="button"
          disabled={state.myLocked || value == null}
          onClick={() => send({ type: 'lock' })}
        >
          {state.myLocked ? 'Locked' : 'Lock answer'}
        </button>
      </div>
    )
  }
  return <NumberAnswer state={state} unit={question.unit} send={send} />
}

function NumberAnswer({
  state,
  unit,
  send,
}: {
  state: TriviaRoomState
  unit?: string
  send: (message: { type: 'answer'; answer: { kind: 'number'; value: number } } | { type: 'lock' }) => void
}) {
  const questionId = state.question?.id ?? ''
  const [draftState, setDraftState] = useState({ questionId, draft: '' })
  if (draftState.questionId !== questionId) setDraftState({ questionId, draft: '' })
  const draft = draftState.draft
  function setDraft(next: string) {
    setDraftState({ questionId, draft: next })
  }

  return (
    <div className="answer-stack">
      <label className="field">
        <span>{unit ? `Your guess (${unit})` : 'Your guess'}</span>
        <input
          inputMode="decimal"
          disabled={state.myLocked}
          value={draft}
          placeholder="0"
          onChange={(event) => {
            const text = event.target.value
            setDraft(text)
            const value = Number(text)
            if (text.trim() !== '' && Number.isFinite(value)) {
              send({ type: 'answer', answer: { kind: 'number', value } })
            }
          }}
        />
      </label>
      <button
        className={!state.myLocked && state.myAnswer?.kind === 'number' ? 'btn primary' : 'btn ghost'}
        type="button"
        disabled={state.myLocked || state.myAnswer?.kind !== 'number'}
        onClick={() => send({ type: 'lock' })}
      >
        {state.myLocked ? 'Locked' : 'Lock answer'}
      </button>
    </div>
  )
}

function ScoreList({ state, totals = false }: { state: TriviaRoomState; totals?: boolean }) {
  if (totals) {
    return (
      <ol className="leaderboard">
        {state.players.map((player, index) => (
          <li key={player.id} className={player.id === state.selfId ? 'you' : undefined}>
            <span className="rank">{index + 1}</span>
            <PlayerName
              name={player.name}
              characterId={player.characterId}
              you={player.id === state.selfId}
            />
            <strong>{player.score}</strong>
          </li>
        ))}
      </ol>
    )
  }
  return (
    <ol className="leaderboard">
      {state.rows.map((row, index) => {
        const player = state.players.find((item) => item.id === row.playerId)
        return (
          <li key={row.playerId} className={row.playerId === state.selfId ? 'you' : undefined}>
            <span className="rank">{index + 1}</span>
            <span className="player-name-block">
              <PlayerName
                name={row.name}
                characterId={row.characterId ?? player?.characterId}
                you={row.playerId === state.selfId}
                size={32}
              />
              <span className="hint">{row.answerText}</span>
            </span>
            <strong className="point-gain">+{row.points}</strong>
          </li>
        )
      })}
    </ol>
  )
}

function HostSettings({
  playerCount,
  settings,
  onChange,
  onStart,
}: {
  playerCount: number
  settings: TriviaSettings
  onChange: (settings: TriviaSettings) => void
  onStart: (settings: TriviaSettings) => void
}) {
  function toggle(id: string) {
    const roundIds = settings.roundIds.includes(id)
      ? settings.roundIds.filter((roundId) => roundId !== id)
      : [...settings.roundIds, id]
    onChange({ ...settings, roundIds })
  }

  return (
    <section className="panel settings">
      <h2>Host setup</h2>
      <p className="hint host-player-note">
        {playerCount} of {MAX_PLAYERS} players in the room
        {playerCount < 2 ? ' — solo works too' : ''}
      </p>
      <div className="field">
        <span>Rounds</span>
        <div className="game-list">
          {TRIVIA_ROUNDS.map((round) => {
            const order = settings.roundIds.indexOf(round.id)
            const selected = order >= 0
            return (
              <button
                key={round.id}
                className={selected ? 'game-card selected' : 'game-card'}
                type="button"
                onClick={() => toggle(round.id)}
              >
                <p className="eyebrow">
                  {selected ? `Play ${order + 1} · ` : ''}
                  {round.title}
                  {round.placeholder ? ' · test only' : ''}
                </p>
                <p>
                  {round.blurb} {round.questions.length} questions.
                </p>
              </button>
            )
          })}
        </div>
      </div>
      <label className="field">
        <span>Seconds per question</span>
        <div className="choice-row">
          {TRIVIA_SECONDS_OPTIONS.map((value) => (
            <button
              key={value}
              className={settings.seconds === value ? 'btn primary compact' : 'btn ghost compact'}
              type="button"
              onClick={() => onChange({ ...settings, seconds: value })}
            >
              {value}s
            </button>
          ))}
        </div>
      </label>
      <div className="settings-start">
        <button
          className="btn primary"
          type="button"
          disabled={settings.roundIds.length === 0}
          onClick={() => onStart(settings)}
        >
          Start game
        </button>
      </div>
    </section>
  )
}

function useTriviaCountdown(state: TriviaRoomState | null) {
  const active = state?.phase === 'question'
  const deadlineMs = state?.deadlineMs ?? null
  const guessSeconds = state?.settings.seconds ?? 0
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) return
    const tick = () => setSeconds(remainingSeconds({ deadlineMs, seconds: guessSeconds }))
    const first = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, 250)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [active, deadlineMs, guessSeconds])
  return active ? seconds : 0
}
