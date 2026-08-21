import { GAME_ID, GAME_TITLE } from './protocol'
import { CUE_GAME_ID, CUE_GAME_TITLE } from '../cue/protocol'

export type GameKind = 'steven' | 'cue'

export type GameInfo = {
  id: GameKind
  title: string
  blurb: string
}

export const GAMES: GameInfo[] = [
  {
    id: GAME_ID,
    title: GAME_TITLE,
    blurb:
      'A place is named. Drop a pin where you think it is. Closest (fewest miles) wins.',
  },
  {
    id: CUE_GAME_ID,
    title: CUE_GAME_TITLE,
    blurb:
      'Hear the start of a song, then tap when you think the lyrics (or another cue) happen.',
  },
]
