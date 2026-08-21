import { clampLatLng, type LatLng } from './geo'
import type { Place } from './locations'

export const GAME_ID = 'steven'
export const GAME_TITLE = 'Where in the World is Steven San Francisco'
export const MAX_PLAYERS = 6
export const MAX_NAME_LENGTH = 20
export const ROOM_CODE_LENGTH = 4
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const MIN_ROUNDS = 1
export const MAX_ROUNDS = 10
export const GUESS_SECONDS_OPTIONS = [20, 30, 45, 60] as const

export type GameSettings = {
  guessSeconds: number
  rounds: number
}

export const DEFAULT_SETTINGS: GameSettings = {
  guessSeconds: 45,
  rounds: 5,
}

export const PHASE = {
  lobby: 'lobby',
  guessing: 'guessing',
  reveal: 'reveal',
  finale: 'finale',
} as const

export type Phase = (typeof PHASE)[keyof typeof PHASE]

export type Player = {
  id: string
  name: string
  score: number
  seenAt?: number
}

export type Pin = LatLng

export type RoundRow = {
  playerId: string
  name: string
  miles: number | null
}

export type HiddenPlace = {
  id: string
  name: string
  category: Place['category']
}

export type RoomState = {
  roomCode: string
  gameId: typeof GAME_ID
  phase: Phase
  selfId: string
  hostId: string | null
  createdBy: string | null
  players: Player[]
  settings: GameSettings
  round: number
  deadlineMs: number | null
  place: HiddenPlace | null
  answer: LatLng | null
  myPin: Pin | null
  pins: Array<{ playerId: string; name: string; lat: number; lng: number }>
  pinnedIds: string[]
  rows: RoundRow[]
  winnerName: string | null
}

export type ClientMessage =
  | { type: 'start'; settings: GameSettings }
  | { type: 'settings'; settings: GameSettings }
  | { type: 'pin'; lat: number; lng: number }
  | { type: 'timesUp' }
  | { type: 'nextRound' }
  | { type: 'backToLobby' }

export function sanitizeName(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return 'Player'
  return trimmed.slice(0, MAX_NAME_LENGTH)
}

export function normalizeRoomCode(raw: string | null | undefined): string {
  return (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH)
}

export function sanitizeGameSettings(raw: unknown): GameSettings {
  const record = isRecord(raw) ? raw : {}
  const guessSeconds = (GUESS_SECONDS_OPTIONS as readonly number[]).includes(
    record.guessSeconds as number,
  )
    ? (record.guessSeconds as number)
    : DEFAULT_SETTINGS.guessSeconds
  const rounds =
    typeof record.rounds === 'number' && Number.isFinite(record.rounds)
      ? Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.round(record.rounds)))
      : DEFAULT_SETTINGS.rounds
  return { guessSeconds, rounds }
}

export function sanitizePin(raw: unknown): Pin | null {
  if (!isRecord(raw)) return null
  return clampLatLng(Number(raw.lat), Number(raw.lng))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
