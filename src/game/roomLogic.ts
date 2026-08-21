import { milesBetween, type LatLng } from './geo'
import { pickPlace, type Place } from './locations'
import {
  DEFAULT_SETTINGS,
  GAME_ID,
  MAX_PLAYERS,
  sanitizeGameSettings,
  sanitizeName,
  sanitizePin,
  type ClientMessage,
  type GameSettings,
  type HiddenPlace,
  type Phase,
  type Player,
  type Pin,
  type RoomState,
  type RoundRow,
} from './protocol'

const NO_GUESS_MILES = 12_450

export type StoredPlace = HiddenPlace & LatLng

export type StoredRoom = {
  phase: Phase
  hostId: string | null
  createdBy: string | null
  players: Record<string, Player>
  settings: GameSettings
  round: number
  deadlineMs: number | null
  guessStartedMs: number | null
  place: StoredPlace | null
  usedPlaceIds: string[]
  pins: Record<string, Pin>
  rows: RoundRow[]
  winnerName: string | null
}

export function emptyRoom(hostId: string, name: string): StoredRoom {
  return {
    phase: 'lobby',
    hostId,
    createdBy: hostId,
    players: { [hostId]: playerRecord(hostId, name) },
    settings: { ...DEFAULT_SETTINGS },
    round: 0,
    deadlineMs: null,
    guessStartedMs: null,
    place: null,
    usedPlaceIds: [],
    pins: {},
    rows: [],
    winnerName: null,
  }
}

export function playerRecord(id: string, name: string, score = 0): Player {
  return { id, name: sanitizeName(name), score, seenAt: Date.now() }
}

export function playerCount(room: StoredRoom) {
  return Object.keys(room.players).length
}

export function toFirebaseRoom(room: StoredRoom) {
  return {
    ...room,
    pins: Object.keys(room.pins).length > 0 ? room.pins : null,
    usedPlaceIds:
      room.usedPlaceIds.length > 0
        ? Object.fromEntries(room.usedPlaceIds.map((id, index) => [String(index), id]))
        : null,
    rows:
      room.rows.length > 0
        ? Object.fromEntries(room.rows.map((row, index) => [String(index), row]))
        : null,
  }
}

export function normalizeStoredRoom(raw: unknown): StoredRoom | null {
  if (!isRecord(raw) || !isPhase(raw.phase)) return null
  return {
    phase: raw.phase,
    hostId: typeof raw.hostId === 'string' ? raw.hostId : null,
    createdBy:
      typeof raw.createdBy === 'string'
        ? raw.createdBy
        : typeof raw.hostId === 'string'
          ? raw.hostId
          : null,
    players: normalizePlayers(raw.players),
    settings: sanitizeGameSettings(raw.settings),
    round: typeof raw.round === 'number' ? raw.round : 0,
    deadlineMs: typeof raw.deadlineMs === 'number' ? raw.deadlineMs : null,
    guessStartedMs: typeof raw.guessStartedMs === 'number' ? raw.guessStartedMs : null,
    place: normalizePlace(raw.place),
    usedPlaceIds: asStringArray(raw.usedPlaceIds),
    pins: normalizePins(raw.pins),
    rows: asArray(raw.rows).filter(isRoundRow),
    winnerName: typeof raw.winnerName === 'string' ? raw.winnerName : null,
  }
}

export function toRoomState(room: StoredRoom, selfId: string, roomCode: string): RoomState {
  const hostId = room.createdBy ?? room.hostId
  const players = Object.values(room.players).sort((a, b) => {
    if (a.id === hostId) return -1
    if (b.id === hostId) return 1
    return a.score - b.score || a.name.localeCompare(b.name)
  })
  const showAnswer = room.phase === 'reveal' || room.phase === 'finale'
  const pins = showAnswer
    ? Object.entries(room.pins).flatMap(([playerId, pin]) => {
        const player = room.players[playerId]
        return player
          ? [{ playerId, name: player.name, lat: pin.lat, lng: pin.lng }]
          : []
      })
    : []
  return {
    roomCode,
    gameId: GAME_ID,
    phase: room.phase,
    selfId,
    hostId,
    createdBy: room.createdBy,
    players,
    settings: room.settings,
    round: room.round,
    deadlineMs: room.deadlineMs,
    place: room.place
      ? { id: room.place.id, name: room.place.name, category: room.place.category }
      : null,
    answer: showAnswer && room.place ? { lat: room.place.lat, lng: room.place.lng } : null,
    myPin: room.pins[selfId] ?? null,
    pins,
    pinnedIds: Object.keys(room.pins),
    rows: showAnswer ? room.rows : [],
    winnerName: room.phase === 'finale' ? room.winnerName : null,
  }
}

export function addPlayer(room: StoredRoom, id: string, name: string): StoredRoom | string {
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

export function applyMessage(
  room: StoredRoom,
  senderId: string,
  message: ClientMessage,
  now = Date.now(),
  choosePlace: (usedIds: string[]) => Place = pickPlace,
): StoredRoom | { error: string } {
  if (!room.players[senderId]) return room

  if (message.type === 'settings' && isHost(room, senderId) && room.phase === 'lobby') {
    return { ...room, settings: sanitizeGameSettings(message.settings) }
  }

  if (message.type === 'start' && isHost(room, senderId) && room.phase === 'lobby') {
    const settings = sanitizeGameSettings(message.settings)
    return beginRound(
      {
        ...room,
        settings,
        round: 0,
        usedPlaceIds: [],
        winnerName: null,
        rows: [],
        pins: {},
        players: Object.fromEntries(
          Object.values(room.players).map((item) => [item.id, { ...item, score: 0 }]),
        ),
      },
      now,
      choosePlace,
    )
  }

  if (message.type === 'pin' && room.phase === 'guessing') {
    const pin = sanitizePin(message)
    if (!pin) return room
    if (room.deadlineMs && now > room.deadlineMs + 1500) return room
    return { ...room, pins: { ...room.pins, [senderId]: pin } }
  }

  if (message.type === 'timesUp' && room.phase === 'guessing') {
    if (!deadlinePassed(room, now)) return room
    return revealRound(room)
  }

  if (message.type === 'nextRound' && isHost(room, senderId) && room.phase === 'reveal') {
    if (room.round >= room.settings.rounds) return finishGame(room)
    return beginRound(room, now, choosePlace)
  }

  if (message.type === 'backToLobby' && isHost(room, senderId)) {
    return {
      ...room,
      phase: 'lobby',
      round: 0,
      deadlineMs: null,
      guessStartedMs: null,
      place: null,
      pins: {},
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
    return Math.max(0, Math.min(input.guessSeconds, Math.ceil((input.deadlineMs - now) / 1000)))
  }
  return input.guessSeconds
}

function beginRound(
  room: StoredRoom,
  now: number,
  choosePlace: (usedIds: string[]) => Place,
): StoredRoom {
  const place = choosePlace(room.usedPlaceIds)
  return {
    ...room,
    phase: 'guessing',
    round: room.round + 1,
    place: {
      id: place.id,
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
    },
    usedPlaceIds: [...room.usedPlaceIds, place.id],
    pins: {},
    rows: [],
    deadlineMs: now + room.settings.guessSeconds * 1000,
    guessStartedMs: now,
    winnerName: null,
  }
}

function revealRound(room: StoredRoom): StoredRoom {
  if (!room.place) return room
  const answer = { lat: room.place.lat, lng: room.place.lng }
  const rows: RoundRow[] = Object.values(room.players)
    .map((player) => {
      const pin = room.pins[player.id]
      return {
        playerId: player.id,
        name: player.name,
        miles: pin ? milesBetween(pin, answer) : null,
      }
    })
    .sort((a, b) => (a.miles ?? NO_GUESS_MILES) - (b.miles ?? NO_GUESS_MILES))

  const players = { ...room.players }
  for (const row of rows) {
    const current = players[row.playerId]
    if (!current) continue
    players[row.playerId] = {
      ...current,
      score: current.score + (row.miles ?? NO_GUESS_MILES),
    }
  }

  return {
    ...room,
    phase: 'reveal',
    rows,
    players,
    deadlineMs: null,
    guessStartedMs: null,
  }
}

function finishGame(room: StoredRoom): StoredRoom {
  const ranked = Object.values(room.players).sort((a, b) => a.score - b.score)
  return {
    ...room,
    phase: 'finale',
    winnerName: ranked[0]?.name ?? null,
    deadlineMs: null,
    guessStartedMs: null,
  }
}

function deadlinePassed(room: StoredRoom, now: number) {
  if (typeof room.deadlineMs === 'number') return now >= room.deadlineMs - 200
  if (typeof room.guessStartedMs === 'number') {
    return now - room.guessStartedMs >= room.settings.guessSeconds * 1000 - 200
  }
  return false
}

function isHost(room: StoredRoom, id: string) {
  return id === room.createdBy || id === room.hostId
}

function pinHost(room: StoredRoom): StoredRoom {
  const createdBy = room.createdBy ?? room.hostId
  return { ...room, createdBy, hostId: createdBy ?? room.hostId }
}

function isPhase(value: unknown): value is Phase {
  return value === 'lobby' || value === 'guessing' || value === 'reveal' || value === 'finale'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

function normalizePlayers(raw: unknown): Record<string, Player> {
  if (!isRecord(raw)) return {}
  const players: Record<string, Player> = {}
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

function normalizePins(raw: unknown): Record<string, Pin> {
  if (!isRecord(raw)) return {}
  const pins: Record<string, Pin> = {}
  for (const [id, value] of Object.entries(raw)) {
    const pin = sanitizePin(value)
    if (pin) pins[id] = pin
  }
  return pins
}

function normalizePlace(raw: unknown): StoredPlace | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  const pin = sanitizePin(raw)
  if (!pin) return null
  const category =
    raw.category === 'City' || raw.category === 'Landmark' || raw.category === 'Nature'
      ? raw.category
      : 'Landmark'
  return { id: raw.id, name: raw.name, category, ...pin }
}

function isRoundRow(value: unknown): value is RoundRow {
  if (!isRecord(value)) return false
  return (
    typeof value.playerId === 'string' &&
    typeof value.name === 'string' &&
    (value.miles === null || typeof value.miles === 'number')
  )
}
