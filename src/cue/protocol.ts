import { CUE_TRACKS } from './catalog'

export const CUE_GAME_ID = 'cue'
export const CUE_GAME_TITLE = 'Hit the Cue'
export const MAX_PLAYERS = 6
export const MAX_NAME_LENGTH = 20
export const MIN_ROUNDS = 1
export const MAX_ROUNDS = 10
export const GUESS_SECONDS_OPTIONS = [15, 20, 30, 45] as const

export type CueSettings = {
  rounds: number
  guessSeconds: number
}

export const DEFAULT_CUE_SETTINGS: CueSettings = {
  rounds: 5,
  guessSeconds: 20,
}

export const CUE_PHASE = {
  lobby: 'lobby',
  guessing: 'guessing',
  reveal: 'reveal',
  finale: 'finale',
} as const

export type CuePhase = (typeof CUE_PHASE)[keyof typeof CUE_PHASE]

export type CuePlayer = {
  id: string
  name: string
  score: number
  seenAt?: number
}

export type CueGuess = {
  ms: number
  locked: boolean
}

export type CueRow = {
  playerId: string
  name: string
  guessMs: number | null
  errorMs: number | null
}

export type CueRoomState = {
  roomCode: string
  gameId: typeof CUE_GAME_ID
  phase: CuePhase
  selfId: string
  hostId: string | null
  createdBy: string | null
  players: CuePlayer[]
  settings: CueSettings
  round: number
  deadlineMs: number | null
  startedAtMs: number | null
  previewMs: number | null
  cueLabel: string | null
  trackId: string | null
  title: string | null
  cueMs: number | null
  myGuessMs: number | null
  myLocked: boolean
  lockedIds: string[]
  guessedIds: string[]
  rows: CueRow[]
  winnerName: string | null
}

export type CueMessage =
  | { type: 'start'; settings: CueSettings }
  | { type: 'settings'; settings: CueSettings }
  | { type: 'guess'; ms: number }
  | { type: 'lock' }
  | { type: 'timesUp' }
  | { type: 'nextRound' }
  | { type: 'backToLobby' }

export function sanitizeName(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return 'Player'
  return trimmed.slice(0, MAX_NAME_LENGTH)
}

export function sanitizeCueSettings(raw: unknown): CueSettings {
  const record = isRecord(raw) ? raw : {}
  const guessSeconds = (GUESS_SECONDS_OPTIONS as readonly number[]).includes(
    record.guessSeconds as number,
  )
    ? (record.guessSeconds as number)
    : DEFAULT_CUE_SETTINGS.guessSeconds
  const rounds =
    typeof record.rounds === 'number' && Number.isFinite(record.rounds)
      ? Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.round(record.rounds)))
      : DEFAULT_CUE_SETTINGS.rounds
  return { rounds, guessSeconds }
}

export function sanitizeGuessMs(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(180_000, Math.round(n)))
}

export function formatOffset(errorMs: number): string {
  const seconds = Math.abs(errorMs) / 1000
  const amount = seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)
  if (Math.abs(errorMs) < 80) return 'on the nose'
  if (errorMs < 0) return `${amount}s early`
  return `${amount}s late`
}

export function knownTrackId(id: string) {
  return CUE_TRACKS.some((track) => track.id === id)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
