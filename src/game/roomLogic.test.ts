import { milesBetween } from './geo'
import { DEFAULT_SETTINGS } from './protocol'
import { PLACES } from './locations'
import {
  addPlayer,
  applyMessage,
  emptyRoom,
  toRoomState,
  type StoredRoom,
} from './roomLogic'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function unwrap(room: StoredRoom | { error: string }): StoredRoom {
  if ('error' in room) throw new Error(room.error)
  return room
}

const eiffel = PLACES.find((place) => place.id === 'eiffel')
assert(eiffel, 'eiffel fixture missing')
const nyc = PLACES.find((place) => place.id === 'nyc')
assert(nyc, 'nyc fixture missing')

const sfToNyc = milesBetween(
  { lat: 37.7749, lng: -122.4194 },
  { lat: 40.7128, lng: -74.006 },
)
assert(sfToNyc > 2500 && sfToNyc < 2700, `SF–NYC should be ~2566 miles, got ${sfToNyc}`)

const host = 'host-1'
const guest = 'guest-2'
let room = emptyRoom(host, 'Ada')
const joined = addPlayer(room, guest, 'Bob')
assert(typeof joined !== 'string', 'join should work')
room = joined

room = unwrap(
  applyMessage(
    room,
    host,
    { type: 'start', settings: { ...DEFAULT_SETTINGS, rounds: 2, guessSeconds: 30 } },
    1_000,
    () => eiffel,
  ),
)
assert(room.phase === 'guessing', `expected guessing, got ${room.phase}`)
assert(room.place?.name === 'Eiffel Tower', 'first place should be the stubbed landmark')
assert(room.round === 1, 'round should start at 1')

const guestView = toRoomState(room, guest, 'ABCD')
assert(guestView.place?.name === 'Eiffel Tower', 'guessers should see the place name')
assert(guestView.answer === null, 'answer coordinates must stay hidden while guessing')
assert(guestView.pins.length === 0, 'other pins stay hidden while guessing')

const early = unwrap(applyMessage(room, guest, { type: 'timesUp' }, 2_000))
assert(early.phase === 'guessing', 'timesUp before the deadline must be ignored')

room = unwrap(applyMessage(room, guest, { type: 'pin', lat: 48.86, lng: 2.35 }, 5_000))
assert(room.pins[guest], 'guest pin should save')
const hostDuringGuess = toRoomState(room, host, 'ABCD')
assert(hostDuringGuess.pins.length === 0, 'host should not see Bob’s pin yet')
assert(hostDuringGuess.pinnedIds.includes(guest), 'host should see that Bob pinned')
assert(hostDuringGuess.myPin === null, 'host has not pinned yet')

room = unwrap(applyMessage(room, host, { type: 'pin', lat: 40.71, lng: -74.0 }, 6_000))
room = unwrap(applyMessage(room, guest, { type: 'timesUp' }, 1_000 + 30_000))
assert(room.phase === 'reveal', `expected reveal, got ${room.phase}`)
assert(room.rows[0]?.playerId === guest, 'closer pin should rank first')
assert((room.rows[0]?.miles ?? 999) < 20, 'Paris pin should be very close')
assert((room.rows[1]?.miles ?? 0) > 3000, 'NYC pin should be thousands of miles off')

const revealView = toRoomState(room, guest, 'ABCD')
assert(revealView.answer?.lat === eiffel.lat, 'reveal should include the true location')
assert(revealView.pins.length === 2, 'reveal should show both pins')

room = unwrap(applyMessage(room, host, { type: 'nextRound' }, 40_000, () => nyc))
assert(room.phase === 'guessing', 'nextRound should start another guess')
assert(room.place?.id === 'nyc', 'second place should be NYC')
assert(Object.keys(room.pins).length === 0, 'pins should reset each round')

room = unwrap(applyMessage(room, host, { type: 'pin', lat: 40.71, lng: -74.01 }, 41_000))
room = unwrap(applyMessage(room, guest, { type: 'timesUp' }, 40_000 + 30_000))
room = unwrap(applyMessage(room, host, { type: 'nextRound' }, 80_000, () => eiffel))
assert(room.phase === 'finale', 'after the last round, nextRound should finish the game')
assert(room.winnerName, 'finale should name a winner')

room = unwrap(applyMessage(room, host, { type: 'backToLobby' }))
assert(room.phase === 'lobby', 'host can return to the lobby')

console.log('roomLogic.test.ts passed')
