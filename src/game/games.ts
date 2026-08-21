import { GAME_ID, GAME_TITLE } from './protocol'

export type GameInfo = {
  id: string
  title: string
  blurb: string
  ready: boolean
}

export const GAMES: GameInfo[] = [
  {
    id: GAME_ID,
    title: GAME_TITLE,
    blurb:
      'A place is named. Drop a pin where you think it is. When time is up, everyone sees how many miles off they were.',
    ready: true,
  },
]
