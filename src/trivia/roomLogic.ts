import { sanitizeCharacterId } from '../game/characters'
import { MAX_PLAYERS, makePlayer, applyIdentity, sanitizeName, type Player } from '../game/protocol'
import { pointsFor, isExact } from './score'
import {
  DEFAULT_TRIVIA_SETTINGS,
  TRIVIA_GAME_ID,
  formatAnswer,
  formatCorrect,
  sanitizeTriviaSettings,
  type PublicQuestion,
  type StoredAnswer,
  type TriviaAnswerInput,
  type TriviaMessage,
  type TriviaPhase,
  type TriviaRoomState,
  type TriviaRow,
  type TriviaSettings,
} from './protocol'
import { TRIVIA_ROUNDS, findRound, type TriviaQuestion, type TriviaRound } from './rounds'

export type StoredTriviaRoom = {
  gameId: typeof TRIVIA_GAME_ID
  phase: TriviaPhase
  hostId: string | null
  createdBy: string | null
  players: Record<string, Player>
  settings: TriviaSettings
  roundIndex: number
  questionIndex: number
  deadlineMs: number | null
  questionStartedMs: number | null
  answers: Record<string, StoredAnswer>
  rows: TriviaRow[]
  winnerName: string | null
}

export function emptyTriviaRoom(
  hostId: string,
  name: string,
  characterId?: string | null,
): StoredTriviaRoom {
  return {
    gameId: TRIVIA_GAME_ID,
    phase: 'lobby',
    hostId,
    createdBy: hostId,
    players: { [hostId]: makePlayer(hostId, name, 0, characterId) },
    settings: {
      seconds: DEFAULT_TRIVIA_SETTINGS.seconds,
      roundIds: [...DEFAULT_TRIVIA_SETTINGS.roundIds],
    },
    roundIndex: 0,
    questionIndex: 0,
    deadlineMs: null,
    questionStartedMs: null,
    answers: {},
    rows: [],
    winnerName: null,
  }
}

export function playerCount(room: StoredTriviaRoom) {
  return Object.keys(room.players).length
}

export function toFirebaseTriviaRoom(room: StoredTriviaRoom) {
  return {
    ...room,
    settings: {
      ...room.settings,
      roundIds:
        room.settings.roundIds.length > 0
          ? Object.fromEntries(room.settings.roundIds.map((id, index) => [String(index), id]))
          : null,
    },
    answers: Object.keys(room.answers).length > 0 ? room.answers : null,
    rows:
      room.rows.length > 0
        ? Object.fromEntries(room.rows.map((row, index) => [String(index), row]))
        : null,
  }
}

export function normalizeTriviaRoom(raw: unknown): StoredTriviaRoom | null {
  if (!isRecord(raw) || raw.gameId !== TRIVIA_GAME_ID || !isPhase(raw.phase)) return null
  const settings = sanitizeTriviaSettings(raw.settings)
  return {
    gameId: TRIVIA_GAME_ID,
    phase: raw.phase,
    hostId: typeof raw.hostId === 'string' ? raw.hostId : null,
    createdBy:
      typeof raw.createdBy === 'string'
        ? raw.createdBy
        : typeof raw.hostId === 'string'
          ? raw.hostId
          : null,
    players: normalizePlayers(raw.players),
    settings,
    roundIndex: asIndex(raw.roundIndex),
    questionIndex: asIndex(raw.questionIndex),
    deadlineMs: asTime(raw.deadlineMs),
    questionStartedMs: asTime(raw.questionStartedMs),
    answers: normalizeAnswers(raw.answers),
    rows: asArray(raw.rows).filter(isTriviaRow),
    winnerName: typeof raw.winnerName === 'string' ? raw.winnerName : null,
  }
}

export function addTriviaPlayer(
  room: StoredTriviaRoom,
  id: string,
  name: string,
  characterId?: string | null,
): StoredTriviaRoom | string {
  if (room.players[id]) {
    return pinHost({
      ...room,
      players: {
        ...room.players,
        [id]: applyIdentity(room.players[id], name, characterId),
      },
    })
  }
  if (playerCount(room) >= MAX_PLAYERS) return `This room is full (${MAX_PLAYERS} players).`
  return pinHost({
    ...room,
    players: {
      ...room.players,
      [id]: makePlayer(id, name, 0, characterId),
    },
  })
}

export function applyTriviaMessage(
  room: StoredTriviaRoom,
  senderId: string,
  message: TriviaMessage,
  now = Date.now(),
  catalog: readonly TriviaRound[] = TRIVIA_ROUNDS,
): StoredTriviaRoom | { error: string } {
  if (!room.players[senderId]) return room

  if (message.type === 'settings' && isHost(room, senderId) && room.phase === 'lobby') {
    return { ...room, settings: sanitizeTriviaSettings(message.settings, catalog) }
  }

  if (message.type === 'start' && isHost(room, senderId) && room.phase === 'lobby') {
    const settings = sanitizeTriviaSettings(message.settings, catalog)
    if (settings.roundIds.length === 0) return { error: 'Pick at least one round.' }
    return beginQuestion(
      {
        ...room,
        settings,
        roundIndex: 0,
        questionIndex: 0,
        winnerName: null,
        rows: [],
        answers: {},
        players: Object.fromEntries(
          Object.values(room.players).map((player) => [player.id, { ...player, score: 0 }]),
        ),
      },
      now,
      catalog,
    )
  }

  if (message.type === 'answer' && room.phase === 'question') {
    if (room.answers[senderId]?.locked) return room
    if (room.deadlineMs && now > room.deadlineMs + 1500) return room
    const question = currentQuestion(room, catalog)
    if (!question) return room
    const parsed = parseAnswer(question, message.answer, now)
    if (!parsed) return room
    return { ...room, answers: { ...room.answers, [senderId]: parsed } }
  }

  if (message.type === 'lock' && room.phase === 'question') {
    const answer = room.answers[senderId]
    if (!answer) return { error: 'Pick an answer before you lock.' }
    const answers = { ...room.answers, [senderId]: { ...answer, locked: true } }
    const next = { ...room, answers }
    if (allPlayersLocked(next)) return revealQuestion(next, catalog)
    return next
  }

  if (message.type === 'timesUp' && room.phase === 'question') {
    if (!deadlinePassed(room, now) && !allPlayersLocked(room)) return room
    return revealQuestion(room, catalog)
  }

  if (message.type === 'next' && isHost(room, senderId) && room.phase === 'reveal') {
    return advance(room, now, catalog)
  }

  if (message.type === 'backToLobby' && isHost(room, senderId)) {
    return {
      ...room,
      phase: 'lobby',
      roundIndex: 0,
      questionIndex: 0,
      deadlineMs: null,
      questionStartedMs: null,
      answers: {},
      rows: [],
      winnerName: null,
    }
  }

  return room
}

export function toTriviaRoomState(
  room: StoredTriviaRoom,
  selfId: string,
  roomCode: string,
  catalog: readonly TriviaRound[] = TRIVIA_ROUNDS,
): TriviaRoomState {
  const hostId = room.createdBy ?? room.hostId
  const players = Object.values(room.players).sort((a, b) => {
    if (room.phase === 'lobby') {
      if (a.id === hostId) return -1
      if (b.id === hostId) return 1
      return a.name.localeCompare(b.name)
    }
    return b.score - a.score || a.name.localeCompare(b.name)
  })
  const show = room.phase === 'reveal' || room.phase === 'finale'
  const cursor = describe(room, catalog)
  const question = questionAt(room, catalog)
  const mine = room.answers[selfId]
  return {
    roomCode,
    gameId: TRIVIA_GAME_ID,
    phase: room.phase,
    selfId,
    hostId,
    createdBy: room.createdBy,
    players,
    settings: room.settings,
    deadlineMs: room.deadlineMs,
    question: cursor,
    correctText: show && question ? formatCorrect(question) : null,
    note: show && question ? question.note ?? null : null,
    myAnswer: mine ? stripAnswer(mine) : null,
    myLocked: mine?.locked === true,
    lockedIds: Object.entries(room.answers)
      .filter(([, answer]) => answer.locked)
      .map(([id]) => id),
    answeredIds: Object.keys(room.answers),
    rows: show ? room.rows : [],
    winnerName: room.phase === 'finale' ? room.winnerName : null,
  }
}

export function remainingSeconds(input: {
  deadlineMs: number | null
  seconds: number
  now?: number
}) {
  const now = input.now ?? Date.now()
  if (typeof input.deadlineMs === 'number') {
    return Math.max(0, Math.min(input.seconds, Math.ceil((input.deadlineMs - now) / 1000)))
  }
  return input.seconds
}

function beginQuestion(
  room: StoredTriviaRoom,
  now: number,
  catalog: readonly TriviaRound[],
): StoredTriviaRoom {
  if (!currentQuestion(room, catalog)) return finishGame(room)
  return {
    ...room,
    phase: 'question',
    answers: {},
    rows: [],
    deadlineMs: now + room.settings.seconds * 1000,
    questionStartedMs: now,
    winnerName: null,
  }
}

function revealQuestion(room: StoredTriviaRoom, catalog: readonly TriviaRound[]): StoredTriviaRoom {
  const question = currentQuestion(room, catalog)
  if (!question || room.questionStartedMs == null || room.deadlineMs == null) return room
  const startedAt = room.questionStartedMs
  const deadlineMs = room.deadlineMs
  const rows: TriviaRow[] = Object.values(room.players)
    .map((player) => {
      const answer = room.answers[player.id] ?? null
      const points = pointsFor(question, answer, startedAt, deadlineMs)
      return {
        playerId: player.id,
        name: player.name,
        characterId: player.characterId,
        answerText: formatAnswer(question, answer),
        points,
        exact: isExact(question, answer),
      }
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))

  const players = { ...room.players }
  for (const row of rows) {
    const current = players[row.playerId]
    if (!current) continue
    players[row.playerId] = { ...current, score: current.score + row.points }
  }

  return {
    ...room,
    phase: 'reveal',
    rows,
    players,
    deadlineMs: null,
    questionStartedMs: room.questionStartedMs,
  }
}

function advance(
  room: StoredTriviaRoom,
  now: number,
  catalog: readonly TriviaRound[],
): StoredTriviaRoom {
  const round = findRound(catalog, room.settings.roundIds[room.roundIndex])
  if (round && room.questionIndex + 1 < round.questions.length) {
    return beginQuestion({ ...room, questionIndex: room.questionIndex + 1 }, now, catalog)
  }
  if (room.roundIndex + 1 < room.settings.roundIds.length) {
    return beginQuestion(
      { ...room, roundIndex: room.roundIndex + 1, questionIndex: 0 },
      now,
      catalog,
    )
  }
  return finishGame(room)
}

function finishGame(room: StoredTriviaRoom): StoredTriviaRoom {
  const ranked = Object.values(room.players).sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  )
  const top = ranked[0]?.score ?? 0
  const winners = ranked.filter((player) => player.score === top)
  return {
    ...room,
    phase: 'finale',
    winnerName: winners.length > 0 ? winners.map((player) => player.name).join(' & ') : null,
    deadlineMs: null,
  }
}

function currentQuestion(room: StoredTriviaRoom, catalog: readonly TriviaRound[]) {
  return questionAt(room, catalog)
}

function questionAt(room: StoredTriviaRoom, catalog: readonly TriviaRound[]) {
  const round = findRound(catalog, room.settings.roundIds[room.roundIndex])
  return round?.questions[room.questionIndex]
}

function describe(room: StoredTriviaRoom, catalog: readonly TriviaRound[]): PublicQuestion | null {
  const round = findRound(catalog, room.settings.roundIds[room.roundIndex])
  const question = round?.questions[room.questionIndex]
  if (!round || !question || room.phase === 'lobby') return null
  return {
    id: question.id,
    kind: question.kind,
    prompt: question.prompt,
    choices: question.kind === 'choice' ? question.choices : undefined,
    unit: question.kind === 'number' ? question.unit : undefined,
    roundId: round.id,
    roundTitle: round.title,
    placeholder: round.placeholder === true,
    roundNumber: room.roundIndex + 1,
    roundCount: room.settings.roundIds.length,
    questionNumber: room.questionIndex + 1,
    questionCount: round.questions.length,
  }
}

function parseAnswer(question: TriviaQuestion, raw: TriviaAnswerInput, at: number): StoredAnswer | null {
  if (question.kind === 'choice' && raw.kind === 'choice') {
    if (!Number.isInteger(raw.index) || raw.index < 0 || raw.index >= question.choices.length) return null
    return { kind: 'choice', index: raw.index, locked: false, at }
  }
  if (question.kind === 'boolean' && raw.kind === 'boolean') {
    if (typeof raw.value !== 'boolean') return null
    return { kind: 'boolean', value: raw.value, locked: false, at }
  }
  if (question.kind === 'number' && raw.kind === 'number') {
    if (typeof raw.value !== 'number' || !Number.isFinite(raw.value)) return null
    const value = Math.max(-1_000_000_000, Math.min(1_000_000_000, raw.value))
    return { kind: 'number', value, locked: false, at }
  }
  return null
}

function stripAnswer(answer: StoredAnswer): TriviaAnswerInput {
  if (answer.kind === 'choice') return { kind: 'choice', index: answer.index }
  if (answer.kind === 'boolean') return { kind: 'boolean', value: answer.value }
  return { kind: 'number', value: answer.value }
}

function allPlayersLocked(room: StoredTriviaRoom) {
  const ids = Object.keys(room.players)
  return ids.length > 0 && ids.every((id) => room.answers[id]?.locked === true)
}

function deadlinePassed(room: StoredTriviaRoom, now: number) {
  if (typeof room.questionStartedMs === 'number' && now - room.questionStartedMs < 2000) return false
  if (typeof room.deadlineMs === 'number') return now >= room.deadlineMs
  return false
}

function isHost(room: StoredTriviaRoom, id: string) {
  return id === room.createdBy || id === room.hostId
}

function pinHost(room: StoredTriviaRoom): StoredTriviaRoom {
  const createdBy = room.createdBy ?? room.hostId
  return { ...room, createdBy, hostId: createdBy ?? room.hostId }
}

function isPhase(value: unknown): value is TriviaPhase {
  return value === 'lobby' || value === 'question' || value === 'reveal' || value === 'finale'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asTime(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) && n > 1_000_000_000_000 ? n : null
}

function asIndex(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!isRecord(value)) return []
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
}

function normalizePlayers(raw: unknown): Record<string, Player> {
  if (!isRecord(raw)) return {}
  const players: Record<string, Player> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue
    const character = sanitizeCharacterId(
      typeof value.characterId === 'string' ? value.characterId : undefined,
    )
    players[id] = {
      id: typeof value.id === 'string' ? value.id : id,
      name: sanitizeName(typeof value.name === 'string' ? value.name : ''),
      score: typeof value.score === 'number' ? value.score : 0,
      seenAt: typeof value.seenAt === 'number' ? value.seenAt : undefined,
      ...(character ? { characterId: character } : {}),
    }
  }
  return players
}

function normalizeAnswers(raw: unknown): Record<string, StoredAnswer> {
  if (!isRecord(raw)) return {}
  const answers: Record<string, StoredAnswer> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value) || (value.kind !== 'choice' && value.kind !== 'boolean' && value.kind !== 'number')) {
      continue
    }
    const at = typeof value.at === 'number' && Number.isFinite(value.at) ? value.at : 0
    if (value.kind === 'choice' && Number.isInteger(value.index)) {
      answers[id] = { kind: 'choice', index: value.index as number, locked: value.locked === true, at }
    } else if (value.kind === 'boolean' && typeof value.value === 'boolean') {
      answers[id] = { kind: 'boolean', value: value.value, locked: value.locked === true, at }
    } else if (value.kind === 'number' && typeof value.value === 'number' && Number.isFinite(value.value)) {
      answers[id] = { kind: 'number', value: value.value, locked: value.locked === true, at }
    }
  }
  return answers
}

function isTriviaRow(value: unknown): value is TriviaRow {
  if (!isRecord(value)) return false
  return (
    typeof value.playerId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.answerText === 'string' &&
    typeof value.points === 'number' &&
    typeof value.exact === 'boolean'
  )
}
