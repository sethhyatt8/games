import { BASE_POINTS, SPEED_BONUS, pointsFor, speedBonus } from './score'
import {
  addTriviaPlayer,
  applyTriviaMessage,
  emptyTriviaRoom,
  normalizeTriviaRoom,
  toFirebaseTriviaRoom,
  toTriviaRoomState,
  type StoredTriviaRoom,
} from './roomLogic'
import { TRIVIA_ROUNDS, validateRounds, type TriviaRound } from './rounds'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function unwrap(room: StoredTriviaRoom | { error: string }): StoredTriviaRoom {
  if ('error' in room && !('phase' in room)) throw new Error(room.error)
  return room as StoredTriviaRoom
}

const problems = validateRounds(TRIVIA_ROUNDS)
assert(problems.length === 0, `placeholder catalog should be valid: ${problems.join('; ')}`)
assert(TRIVIA_ROUNDS.length === 1, 'ship one placeholder round only')
const sample = TRIVIA_ROUNDS[0]
assert(sample?.placeholder === true, 'the shipped round is marked as a placeholder')
assert(sample?.questions.length === 3, 'placeholder has 3 dummy questions')
assert(
  sample?.questions.map((question) => question.kind).join(',') === 'choice,boolean,number',
  'placeholder covers every question kind',
)

const choice = sample!.questions[0]
const booleanQ = sample!.questions[1]
const numberQ = sample!.questions[2]
assert(choice?.kind === 'choice' && booleanQ?.kind === 'boolean' && numberQ?.kind === 'number')

const started = 10_000
const deadline = started + 20_000
assert(speedBonus(started, started, deadline) === SPEED_BONUS, 'instant answer gets the full speed bonus')
assert(speedBonus(deadline, started, deadline) === 0, 'buzzer answer gets no speed bonus')
assert(
  pointsFor(choice!, { kind: 'choice', index: 0, locked: true, at: started }, started, deadline) ===
    BASE_POINTS + SPEED_BONUS,
  'right choice pays 1000 plus speed',
)
assert(
  pointsFor(choice!, { kind: 'choice', index: 1, locked: true, at: started }, started, deadline) === 0,
  'wrong choice scores nothing',
)
assert(
  pointsFor(booleanQ!, { kind: 'boolean', value: false, locked: true, at: started }, started, deadline) === 0,
  'wrong true/false scores nothing',
)
assert(
  pointsFor(numberQ!, { kind: 'number', value: 3, locked: true, at: deadline }, started, deadline) ===
    BASE_POINTS,
  'exact number at the buzzer is 1000',
)
assert(
  pointsFor(numberQ!, { kind: 'number', value: 4, locked: false, at: started }, started, deadline) === 667,
  'one side off a triangle is about two thirds of the points',
)
assert(
  pointsFor(numberQ!, { kind: 'number', value: 9, locked: false, at: started }, started, deadline) === 0,
  'a number a full scale away scores 0',
)
assert(pointsFor(numberQ!, null, started, deadline) === 0, 'a blank answer scores 0')

const catalog: TriviaRound[] = [
  {
    id: 'alpha',
    title: 'Alpha',
    blurb: 'test',
    questions: [
      { id: 'c', kind: 'choice', prompt: 'Pick blue', choices: ['Blue', 'No'], answer: 0 },
      { id: 'b', kind: 'boolean', prompt: 'Yes?', answer: true },
    ],
  },
  {
    id: 'beta',
    title: 'Beta',
    blurb: 'test',
    questions: [{ id: 'n', kind: 'number', prompt: 'How many?', answer: 10, unit: 'things' }],
  },
]

const host = 'host-1'
const guest = 'guest-2'
let room = emptyTriviaRoom(host, 'Ada', 'seth')
assert(room.players[host]?.characterId === 'seth', 'host avatar is stored')
const joined = addTriviaPlayer(room, guest, 'Bea', 'not-a-person')
assert(typeof joined !== 'string', 'join should work')
room = joined
assert(room.players[guest]?.characterId === undefined, 'unknown avatars are dropped')
room = unwrap(addTriviaPlayer(room, guest, 'Bea', 'emily'))
assert(room.players[guest]?.characterId === 'emily', 'a known avatar sticks')

const refused = applyTriviaMessage(room, guest, { type: 'start', settings: { seconds: 20, roundIds: ['alpha'] } }, started, catalog)
assert(!('error' in refused) && refused.phase === 'lobby', 'only the host can start')

const missing = applyTriviaMessage(room, host, { type: 'start', settings: { seconds: 20, roundIds: ['nope'] } }, started, catalog)
assert('error' in missing, 'a start with no real rounds is rejected')

room = unwrap(
  applyTriviaMessage(
    room,
    host,
    { type: 'start', settings: { seconds: 20, roundIds: ['nope', 'alpha', 'alpha', 'beta'] } },
    started,
    catalog,
  ),
)
assert(room.phase === 'question', 'host start opens the first question')
assert(room.settings.roundIds.join(',') === 'alpha,beta', 'unknown and duplicate rounds are dropped, order kept')
assert(room.players[host]?.score === 0 && room.players[guest]?.score === 0, 'scores reset at the start')

const hidden = toTriviaRoomState(room, guest, 'WXYZ', catalog)
assert(hidden.question?.prompt === 'Pick blue', 'players see the prompt')
assert(hidden.correctText === null, 'the right answer stays hidden while the question is open')
assert(hidden.rows.length === 0, 'other answers stay hidden while the question is open')
assert(hidden.question?.choices?.length === 2, 'choices are visible')

const early = unwrap(applyTriviaMessage(room, guest, { type: 'timesUp' }, started + 500, catalog))
assert(early.phase === 'question', 'timesUp in the first moments is ignored')

room = unwrap(
  applyTriviaMessage(room, guest, { type: 'answer', answer: { kind: 'choice', index: 0 } }, started + 1000, catalog),
)
room = unwrap(
  applyTriviaMessage(room, host, { type: 'answer', answer: { kind: 'choice', index: 1 } }, started + 5000, catalog),
)
const ignoredKind = unwrap(
  applyTriviaMessage(room, guest, { type: 'answer', answer: { kind: 'number', value: 1 } }, started + 1200, catalog),
)
assert(ignoredKind.answers[guest]?.kind === 'choice', 'an answer of the wrong kind is ignored')

const oneLock = unwrap(applyTriviaMessage(room, guest, { type: 'lock' }, started + 1500, catalog))
assert(oneLock.phase === 'question', 'one lock does not end the question')
const stuck = unwrap(
  applyTriviaMessage(oneLock, guest, { type: 'answer', answer: { kind: 'choice', index: 1 } }, started + 1600, catalog),
)
assert(stuck.answers[guest]?.kind === 'choice' && stuck.answers[guest]?.index === 0, 'a locked answer cannot change')

room = unwrap(applyTriviaMessage(oneLock, host, { type: 'lock' }, started + 6000, catalog))
assert(room.phase === 'reveal', 'the question reveals once everyone locks')
assert(room.rows[0]?.playerId === guest, 'the faster correct answer ranks first')
assert((room.rows[0]?.points ?? 0) > (room.rows[1]?.points ?? 0), 'speed bonus puts the fast player ahead')
assert(room.rows[1]?.points === 0, 'the wrong choice scores 0')

const reveal = toTriviaRoomState(room, guest, 'WXYZ', catalog)
assert(reveal.correctText === 'Blue', 'reveal shows the right choice')
assert(reveal.rows.length === 2, 'reveal lists every player')

const guestNext = applyTriviaMessage(room, guest, { type: 'next' }, started + 7000, catalog)
assert(!('error' in guestNext) && guestNext.phase === 'reveal', 'only the host advances')

room = unwrap(applyTriviaMessage(room, host, { type: 'next' }, started + 8000, catalog))
assert(room.phase === 'question', 'next opens the following question')
assert(room.questionIndex === 1, 'the second question of the round is next')
assert(Object.keys(room.answers).length === 0, 'answers reset each question')
const guestScore = room.players[guest]?.score ?? 0
assert(guestScore > 1000, 'the first question score carries forward')

room = unwrap(applyTriviaMessage(room, host, { type: 'timesUp' }, started + 8000 + 20_000, catalog))
assert(room.phase === 'reveal', 'the timer reveals a question nobody answered')
assert(room.rows.every((row) => row.points === 0), 'blanks score 0')

room = unwrap(applyTriviaMessage(room, host, { type: 'next' }, started + 40_000, catalog))
assert(room.phase === 'question' && room.roundIndex === 1 && room.questionIndex === 0, 'the next round starts')
const numberView = toTriviaRoomState(room, host, 'WXYZ', catalog)
assert(numberView.question?.kind === 'number', 'the number question is dealt')
assert(numberView.question?.unit === 'things', 'the unit is shown without the answer')

room = unwrap(
  applyTriviaMessage(room, host, { type: 'answer', answer: { kind: 'number', value: 10 } }, started + 41_000, catalog),
)
room = unwrap(
  applyTriviaMessage(room, guest, { type: 'answer', answer: { kind: 'number', value: 12 } }, started + 42_000, catalog),
)
room = unwrap(applyTriviaMessage(room, host, { type: 'timesUp' }, started + 40_000 + 20_000, catalog))
assert(room.phase === 'reveal', 'time running out reveals the number question')
const hostRow = room.rows.find((row) => row.playerId === host)
const guestRow = room.rows.find((row) => row.playerId === guest)
assert(hostRow?.exact === true && (hostRow?.points ?? 0) >= BASE_POINTS, 'an exact number is marked exact')
assert(guestRow?.exact === false && (guestRow?.points ?? 0) > 0 && (guestRow?.points ?? 0) < BASE_POINTS, 'a close number earns partial credit')

room = unwrap(applyTriviaMessage(room, host, { type: 'next' }, started + 70_000, catalog))
assert(room.phase === 'finale', 'the last question ends the game')
assert(room.winnerName === 'Bea', 'highest score wins')

const restored = normalizeTriviaRoom(toFirebaseTriviaRoom(room))
assert(restored?.phase === 'finale', 'a firebase snapshot normalizes back')
assert(restored?.settings.roundIds.join(',') === 'alpha,beta', 'round order survives firebase object encoding')
assert(restored?.players[guest]?.characterId === 'emily', 'avatars survive a snapshot')

room = unwrap(applyTriviaMessage(room, host, { type: 'backToLobby' }, started + 80_000, catalog))
assert(room.phase === 'lobby', 'the host can return to the lobby')

console.log('trivia/roomLogic.test.ts passed')
