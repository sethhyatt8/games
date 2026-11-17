import type { Player } from '../game/protocol'
import { TRIVIA_ROUNDS, findRound, type TriviaQuestion, type TriviaRound } from './rounds'

export const TRIVIA_GAME_ID = 'trivia' as const
export const TRIVIA_GAME_TITLE = 'Trivia'

export const TRIVIA_SECONDS_OPTIONS = [15, 20, 30, 45] as const

export type TriviaPhase = 'lobby' | 'question' | 'reveal' | 'finale'

export type TriviaSettings = {
  seconds: number
  /** Round ids in the order they will be played. */
  roundIds: string[]
}

export function defaultRoundIds(rounds: readonly TriviaRound[] = TRIVIA_ROUNDS) {
  const real = rounds.filter((round) => !round.placeholder)
  const source = real.length > 0 ? real : rounds
  return source.map((round) => round.id)
}

export const DEFAULT_TRIVIA_SETTINGS: TriviaSettings = {
  seconds: 20,
  roundIds: defaultRoundIds(),
}

export type TriviaAnswerInput =
  | { kind: 'choice'; index: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'number'; value: number }

export type StoredAnswer = TriviaAnswerInput & {
  locked: boolean
  /** When this answer was set. Speed bonus uses this, not the lock time. */
  at: number
}

export type TriviaMessage =
  | { type: 'settings'; settings: TriviaSettings }
  | { type: 'start'; settings: TriviaSettings }
  | { type: 'answer'; answer: TriviaAnswerInput }
  | { type: 'lock' }
  | { type: 'timesUp' }
  | { type: 'next' }
  | { type: 'backToLobby' }

export type PublicQuestion = {
  id: string
  kind: TriviaQuestion['kind']
  prompt: string
  choices?: string[]
  unit?: string
  roundId: string
  roundTitle: string
  placeholder: boolean
  roundNumber: number
  roundCount: number
  questionNumber: number
  questionCount: number
}

export type TriviaRow = {
  playerId: string
  name: string
  characterId?: string
  answerText: string
  points: number
  exact: boolean
}

export type TriviaRoomState = {
  roomCode: string
  gameId: typeof TRIVIA_GAME_ID
  phase: TriviaPhase
  selfId: string
  hostId: string | null
  createdBy: string | null
  players: Player[]
  settings: TriviaSettings
  deadlineMs: number | null
  question: PublicQuestion | null
  correctText: string | null
  note: string | null
  myAnswer: TriviaAnswerInput | null
  myLocked: boolean
  lockedIds: string[]
  answeredIds: string[]
  rows: TriviaRow[]
  winnerName: string | null
}

const ROUND_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Seconds are always clamped to the allowed timers.
 * Pass `rounds` to keep only ids this client can play (host start/settings).
 * Omit it when reading a room so an older phone does not delete rounds it
 * has not heard of yet.
 */
export function sanitizeTriviaSettings(
  raw: unknown,
  rounds?: readonly TriviaRound[],
): TriviaSettings {
  const record = isRecord(raw) ? raw : {}
  const seconds = (TRIVIA_SECONDS_OPTIONS as readonly number[]).includes(record.seconds as number)
    ? (record.seconds as number)
    : DEFAULT_TRIVIA_SETTINGS.seconds
  const roundIds: string[] = []
  for (const id of asStringList(record.roundIds)) {
    if (!ROUND_ID.test(id) || roundIds.includes(id)) continue
    if (rounds && !findRound(rounds, id)) continue
    roundIds.push(id)
  }
  return { seconds, roundIds }
}

export function formatAnswer(question: TriviaQuestion, answer: TriviaAnswerInput | null) {
  if (!answer) return 'No answer'
  if (question.kind === 'choice' && answer.kind === 'choice') {
    return question.choices[answer.index] ?? '—'
  }
  if (question.kind === 'boolean' && answer.kind === 'boolean') {
    return answer.value ? 'True' : 'False'
  }
  if (question.kind === 'number' && answer.kind === 'number') {
    const value = formatNumber(answer.value)
    return question.unit ? `${value} ${question.unit}` : value
  }
  return '—'
}

export function formatCorrect(question: TriviaQuestion) {
  if (question.kind === 'choice') return question.choices[question.answer] ?? '—'
  if (question.kind === 'boolean') return question.answer ? 'True' : 'False'
  const value = formatNumber(question.answer)
  return question.unit ? `${value} ${question.unit}` : value
}

function formatNumber(value: number) {
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 1000) / 1000)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (!isRecord(value)) return []
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
    .filter((item): item is string => typeof item === 'string')
}
