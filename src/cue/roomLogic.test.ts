import { DEFAULT_CUE_SETTINGS } from './protocol'
import { CUE_TRACKS } from './catalog'
import {
  addCuePlayer,
  applyCueMessage,
  emptyCueRoom,
  toCueRoomState,
  type StoredCueRoom,
} from './roomLogic'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function unwrap(room: StoredCueRoom | { error: string }): StoredCueRoom {
  if ('error' in room) throw new Error(room.error)
  return room
}

const track = CUE_TRACKS[0]
assert(track, 'need a practice track')

const host = 'host-1'
const guest = 'guest-2'
let room = emptyCueRoom(host, 'Ada')
const joined = addCuePlayer(room, guest, 'Bob')
assert(typeof joined !== 'string', 'join should work')
room = joined

room = unwrap(
  applyCueMessage(
    room,
    host,
    { type: 'start', settings: { ...DEFAULT_CUE_SETTINGS, rounds: 2, guessSeconds: 15 } },
    1_000,
    () => track,
  ),
)
assert(room.phase === 'guessing', `expected guessing, got ${room.phase}`)
assert(room.trackId === track.id, 'should pick the stubbed track')

const guestView = toCueRoomState(room, guest, 'ABCD')
assert(guestView.cueMs === null, 'cue time must stay hidden while guessing')
assert(guestView.title === null, 'title stays hidden while guessing')
assert(guestView.cueLabel === track.cueLabel, 'players should know what to listen for')

const early = unwrap(applyCueMessage(room, guest, { type: 'timesUp' }, 2_000))
assert(early.phase === 'guessing', 'timesUp before the deadline must be ignored')

room = unwrap(applyCueMessage(room, guest, { type: 'guess', ms: 7900 }, 5_000))
const hostLocked = applyCueMessage(room, host, { type: 'lock' }, 6_000)
assert('error' in hostLocked, 'host cannot lock without a guess')

room = unwrap(applyCueMessage(room, host, { type: 'guess', ms: 12000 }, 7_000))
room = unwrap(applyCueMessage(room, guest, { type: 'lock' }, 8_000))
assert(room.phase === 'guessing', 'one lock should not end the round')
room = unwrap(applyCueMessage(room, host, { type: 'lock' }, 9_000))
assert(room.phase === 'reveal', 'everyone locked should reveal')
assert(room.rows[0]?.playerId === guest, 'closer guess should rank first')

const revealView = toCueRoomState(room, guest, 'ABCD')
assert(revealView.cueMs === track.cueMs, 'reveal should show the cue time')
assert(revealView.title === track.title, 'reveal should show the title')

console.log('cue/roomLogic.test.ts passed')
