import { CUE_GAME_ID, CUE_GAME_TITLE } from '../cue/protocol'
import { TRIVIA_GAME_ID, TRIVIA_GAME_TITLE } from '../trivia/protocol'
import { GAME_ID, GAME_TITLE } from './protocol'

/**
 * Registry of party games. To add one:
 * 1. Give it a stable id and room logic (see src/trivia for the latest example).
 * 2. Add a card here.
 * 3. Branch on that id in App.tsx `RoomGate` and mount its screen.
 * Room documents store `gameId` so a phone that only has the code still
 * opens the right game.
 */
export const GAME_IDS = [GAME_ID, CUE_GAME_ID, TRIVIA_GAME_ID] as const

export type GameKind = (typeof GAME_IDS)[number]

export type GameInfo = {
  id: GameKind
  title: string
  blurb: string
}

export function isGameKind(value: unknown): value is GameKind {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value)
}

export const GAMES: GameInfo[] = [
  {
    id: GAME_ID,
    title: GAME_TITLE,
    blurb: 'A place is named. Drop a pin where you think it is. Closest (fewest miles) wins.',
  },
  {
    id: CUE_GAME_ID,
    title: CUE_GAME_TITLE,
    blurb: 'Hear the start of a song, then tap when you think the lyrics (or another cue) happen.',
  },
  {
    id: TRIVIA_GAME_ID,
    title: TRIVIA_GAME_TITLE,
    blurb: 'The host picks rounds. Everyone answers on a timer. Highest score wins.',
  },
]
