import { isGameKind, type GameKind } from './games'
import { ROOM_CODE_LENGTH, normalizeRoomCode } from './protocol'

/** Drop the Vite base prefix so `/games/g/trivia` and `/g/trivia` both match. */
export function stripBase(pathname: string, base: string) {
  const path = pathname || '/'
  if (!base.startsWith('/')) return path
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  if (!prefix) return path
  if (path === prefix) return '/'
  if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length) || '/'
  return path
}

export function readLocation(
  href: string,
  base = '/',
): { roomCode: string; gameId: GameKind | null } {
  const url = new URL(href, 'http://localhost')
  const path = stripBase(url.pathname, base)
  let roomCode = normalizeRoomCode(url.searchParams.get('room'))
  const roomMatch = path.match(/^\/room\/([a-zA-Z0-9]+)\/?$/)
  if (!roomCode && roomMatch?.[1]) roomCode = normalizeRoomCode(roomMatch[1])
  let gameId: GameKind | null = null
  const fromQuery = url.searchParams.get('game')
  if (isGameKind(fromQuery)) gameId = fromQuery
  const gameMatch = path.match(/^\/g\/([a-z0-9-]+)\/?$/)
  if (gameMatch?.[1] && isGameKind(gameMatch[1])) gameId = gameMatch[1]
  if (roomCode.length !== ROOM_CODE_LENGTH) roomCode = ''
  return { roomCode, gameId }
}

/** Directory the app was loaded from. Keeps GitHub Pages project sites on `/games/`. */
export function appRootPath(pathname: string, base: string) {
  if (base.startsWith('/')) return base.endsWith('/') ? base : `${base}/`
  if (pathname.endsWith('/')) return pathname
  const slash = pathname.lastIndexOf('/')
  return slash >= 0 ? pathname.slice(0, slash + 1) : '/'
}
