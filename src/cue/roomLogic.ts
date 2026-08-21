import { pickTrack, trackById, type CueTrack } from './catalog'
import {
  CUE_GAME_ID,
  DEFAULT_CUE_SETTINGS,
  MAX_PLAYERS,
  sanitizeCueSettings,
  sanitizeGuessMs,
  sanitizeName,
  type CueGuess,
  type CueMessage,
  type CuePhase,
  type CuePlayer,
  type CueRoomState,
  type CueRow,
  type CueSettings,
} from './protocol'

const MISS_MS = 60_000

export type StoredCueRoom = {
  gameId: typeof CUE_GAME_ID
  phase: CuePhase
  hostId: string | null
  createdBy: string | null
  players: Record<string, CuePlayer>
  settings: CueSettings
  round: number
  deadlineMs: number | null
  startedAtMs: number | null
  trackId: string | null
  usedTrackIds: string[]
  guesses: Record<string, CueGuess>
  rows: CueRow[]
  winnerName: string | null
}

export function emptyCueRoom(hostId: string, name: string): StoredCueRoom {
  return {
    gameId: CUE_GAME_ID,
    phase: 'lobby',
    hostId,
    createdBy: hostId,
    players: { [hostId]: playerRecord(hostId, name) },
    settings: { ...DEFAULT_CUE_SETTINGS },
    round: 0,
    deadlineMs: null,
    startedAtMs: null,
    trackId: null,
    usedTrackIds: [],
    guesses: {},
    rows: [],
    winnerName: null,
  }
}

export function playerRecord(id: string, name: string, score = 0): CuePlayer {
  return { id, name: sanitizeName(name), score, seenAt: Date.now() }
}

export function playerCount(room: StoredCueRoom) {
  return Object.keys(room.players).length
}

export function toFirebaseCueRoom(room: StoredCueRoom) {
  return {
    ...room,
    usedTrackIds:
      room.usedTrackIds.length > 0
        ? Object.fromEntries(room.usedTrackIds.map((id, index) => [String(index), id]))
        : null,
    guesses: Object.keys(room.guesses).length > 0 ? room.guesses : null,
    rows:
      room.rows.length > 0
        ? Object.fromEntries(room.rows.map((row, index) => [String(index), row]))
        : null,
  }
}

export function normalizeCueRoom(raw: unknown): StoredCueRoom | null {
  if (!isRecord(raw) || raw.gameId !== CUE_GAME_ID || !isPhase(raw.phase)) return null
  return {
    gameId: CUE_GAME_ID,
    phase: raw.phase,
    hostId: typeof raw.hostId === 'string' ? raw.hostId : null,
    createdBy:
      typeof raw.createdBy === 'string'
        ? raw.createdBy
        : typeof raw.hostId === 'string'
          ? raw.hostId
          : null,
    players: normalizePlayers(raw.players),
    settings: sanitizeCueSettings(raw.settings),
    round: typeof raw.round === 'number' ? raw.round : 0,
    deadlineMs: asTime(raw.deadlineMs),
    startedAtMs: asTime(raw.startedAtMs),
    trackId: typeof raw.trackId === 'string' ? raw.trackId : null,
    usedTrackIds: asStringArray(raw.usedTrackIds),
    guesses: normalizeGuesses(raw.guesses),
    rows: asArray(raw.rows).filter(isCueRow),
    winnerName: typeof raw.winnerName === 'string' ? raw.winnerName : null,
  }
}

export function toCueRoomState(
  room: StoredCueRoom,
  selfId: string,
  roomCode: string,
): CueRoomState {
  const hostId = room.createdBy ?? room.hostId
  const players = Object.values(room.players).sort((a, b) => {
    if (a.id === hostId) return -1
    if (b.id === hostId) return 1
    return a.score - b.score || a.name.localeCompare(b.name)
  })
  const track = room.trackId ? trackById(room.trackId) : undefined
  const showAnswer = room.phase === 'reveal' || room.phase === 'finale'
  const mine = room.guesses[selfId]
  return {
    roomCode,
    gameId: CUE_GAME_ID,
    phase: room.phase,
    selfId,
    hostId,
    createdBy: room.createdBy,
    players,
    settings: room.settings,
    round: room.round,
    deadlineMs: room.deadlineMs,
    startedAtMs: room.startedAtMs,
    previewMs: track?.previewMs ?? null,
    cueLabel: track?.cueLabel ?? null,
    trackId: room.trackId,
    title: showAnswer ? track?.title ?? null : null,
    cueMs: showAnswer ? track?.cueMs ?? null : null,
    myGuessMs: mine?.ms ?? null,
    myLocked: mine?.locked === true,
    lockedIds: Object.entries(room.guesses)
      .filter(([, guess]) => guess.locked)
      .map(([id]) => id),
    guessedIds: Object.keys(room.guesses),
    rows: showAnswer ? room.rows : [],
    winnerName: room.phase === 'finale' ? room.winnerName : null,
  }
}

export function addCuePlayer(room: StoredCueRoom, id: string, name: string): StoredCueRoom | string {
  if (room.players[id]) {
    return pinHost({
      ...room,
      players: {
        ...room.players,
        [id]: { ...room.players[id], name: sanitizeName(name), seenAt: Date.now() },
      },
    })
  }
  if (playerCount(room) >= MAX_PLAYERS) return 'This room is full (6 players).'
  return pinHost({
    ...room,
    players: {
      ...room.players,
      [id]: playerRecord(id, name),
    },
  })
}

export function applyCueMessage(
  room: StoredCueRoom,
  senderId: string,
  message: CueMessage,
  now = Date.now(),
  chooseTrack: (usedIds: string[]) => CueTrack = pickTrack,
): StoredCueRoom | { error: string } {
  if (!room.players[senderId]) return room

  if (message.type === 'settings' && isHost(room, senderId) && room.phase === 'lobby') {
    return { ...room, settings: sanitizeCueSettings(message.settings) }
  }

  if (message.type === 'start' && isHost(room, senderId) && room.phase === 'lobby') {
    const settings = sanitizeCueSettings(message.settings)
    return beginRound(
      {
        ...room,
        settings,
        round: 0,
        usedTrackIds: [],
        winnerName: null,
        rows: [],
        guesses: {},
        players: Object.fromEntries(
          Object.values(room.players).map((item) => [item.id, { ...item, score: 0 }]),
        ),
      },
      now,
      chooseTrack,
    )
  }

  if (message.type === 'guess' && room.phase === 'guessing') {
    if (room.guesses[senderId]?.locked) return room
    const ms = sanitizeGuessMs(message.ms)
    if (ms == null) return room
    if (room.deadlineMs && now > room.deadlineMs + 1500) return room
    return {
      ...room,
      guesses: { ...room.guesses, [senderId]: { ms, locked: false } },
    }
  }

  if (message.type === 'lock' && room.phase === 'guessing') {
    const guess = room.guesses[senderId]
    if (!guess) return { error: 'Tap a moment before you lock.' }
    const guesses = { ...room.guesses, [senderId]: { ...guess, locked: true } }
    const next = { ...room, guesses }
    if (allPlayersLocked(next)) return revealRound(next)
    return next
  }

  if (message.type === 'timesUp' && room.phase === 'guessing') {
    if (!deadlinePassed(room, now) && !allPlayersLocked(room)) return room
    return revealRound(room)
  }

  if (message.type === 'nextRound' && isHost(room, senderId) && room.phase === 'reveal') {
    if (room.round >= room.settings.rounds) return finishGame(room)
    return beginRound(room, now, chooseTrack)
  }

  if (message.type === 'backToLobby' && isHost(room, senderId)) {
    return {
      ...room,
      phase: 'lobby',
      round: 0,
      deadlineMs: null,
      startedAtMs: null,
      trackId: null,
      guesses: {},
      rows: [],
      winnerName: null,
    }
  }

  return room
}

export function remainingSeconds(input: {
  deadlineMs: number | null
  guessSeconds: number
  now?: number
}) {
  const now = input.now ?? Date.now()
  if (typeof input.deadlineMs === 'number') {
    return Math.max(0, Math.min(90, Math.ceil((input.deadlineMs - now) / 1000)))
  }
  return input.guessSeconds
}

function beginRound(
  room: StoredCueRoom,
  now: number,
  chooseTrack: (usedIds: string[]) => CueTrack,
): StoredCueRoom {
  const track = chooseTrack(room.usedTrackIds)
  const startedAtMs = now
  const afterFade = track.previewMs + room.settings.guessSeconds * 1000
  const afterCue = track.cueMs + 6000
  return {
    ...room,
    phase: 'guessing',
    round: room.round + 1,
    trackId: track.id,
    usedTrackIds: [...room.usedTrackIds, track.id],
    guesses: {},
    rows: [],
    startedAtMs,
    deadlineMs: startedAtMs + Math.max(afterFade, afterCue),
    winnerName: null,
  }
}

function revealRound(room: StoredCueRoom): StoredCueRoom {
  const track = room.trackId ? trackById(room.trackId) : undefined
  const cueMs = track?.cueMs ?? 0
  const rows: CueRow[] = Object.values(room.players)
    .map((player) => {
      const guess = room.guesses[player.id]
      const errorMs = guess ? guess.ms - cueMs : null
      return {
        playerId: player.id,
        name: player.name,
        guessMs: guess?.ms ?? null,
        errorMs,
      }
    })
    .sort(
      (a, b) =>
        (a.errorMs == null ? MISS_MS : Math.abs(a.errorMs)) -
        (b.errorMs == null ? MISS_MS : Math.abs(b.errorMs)),
    )

  const players = { ...room.players }
  for (const row of rows) {
    const current = players[row.playerId]
    if (!current) continue
    players[row.playerId] = {
      ...current,
      score: current.score + (row.errorMs == null ? MISS_MS : Math.abs(row.errorMs)),
    }
  }

  return {
    ...room,
    phase: 'reveal',
    rows,
    players,
    deadlineMs: null,
  }
}

function finishGame(room: StoredCueRoom): StoredCueRoom {
  const ranked = Object.values(room.players).sort((a, b) => a.score - b.score)
  return {
    ...room,
    phase: 'finale',
    winnerName: ranked[0]?.name ?? null,
    deadlineMs: null,
    startedAtMs: null,
  }
}

export function allPlayersLocked(room: StoredCueRoom) {
  const ids = Object.keys(room.players)
  return ids.length > 0 && ids.every((id) => room.guesses[id]?.locked === true)
}

function deadlinePassed(room: StoredCueRoom, now: number) {
  if (typeof room.startedAtMs === 'number' && now - room.startedAtMs < 2000) return false
  if (typeof room.deadlineMs === 'number') return now >= room.deadlineMs
  return false
}

function isHost(room: StoredCueRoom, id: string) {
  return id === room.createdBy || id === room.hostId
}

function pinHost(room: StoredCueRoom): StoredCueRoom {
  const createdBy = room.createdBy ?? room.hostId
  return { ...room, createdBy, hostId: createdBy ?? room.hostId }
}

function isPhase(value: unknown): value is CuePhase {
  return value === 'lobby' || value === 'guessing' || value === 'reveal' || value === 'finale'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asTime(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) && n > 1_000_000_000_000 ? n : null
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!isRecord(value)) return []
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
}

function asStringArray(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === 'string')
}

function normalizePlayers(raw: unknown): Record<string, CuePlayer> {
  if (!isRecord(raw)) return {}
  const players: Record<string, CuePlayer> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue
    players[id] = {
      id: typeof value.id === 'string' ? value.id : id,
      name: typeof value.name === 'string' && value.name.trim() ? value.name : 'Player',
      score: typeof value.score === 'number' ? value.score : 0,
      seenAt: typeof value.seenAt === 'number' ? value.seenAt : undefined,
    }
  }
  return players
}

function normalizeGuesses(raw: unknown): Record<string, CueGuess> {
  if (!isRecord(raw)) return {}
  const guesses: Record<string, CueGuess> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue
    const ms = sanitizeGuessMs(value.ms)
    if (ms == null) continue
    guesses[id] = { ms, locked: value.locked === true }
  }
  return guesses
}

function isCueRow(value: unknown): value is CueRow {
  if (!isRecord(value)) return false
  return (
    typeof value.playerId === 'string' &&
    typeof value.name === 'string' &&
    (value.guessMs === null || typeof value.guessMs === 'number') &&
    (value.errorMs === null || typeof value.errorMs === 'number')
  )
}
