import { appRootPath, readLocation, stripBase } from './routes'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(stripBase('/games/g/trivia', '/games/') === '/g/trivia', 'project-site base is stripped')
assert(stripBase('/g/trivia', './') === '/g/trivia', 'relative base leaves the path alone')
assert(stripBase('/games', '/games/') === '/', 'the base itself is the app root')

const query = readLocation('http://localhost/?room=k7qm&game=trivia', '/')
assert(query.roomCode === 'K7QM', 'query room codes are normalized')
assert(query.gameId === 'trivia', 'query game id is read')

const pathRoom = readLocation('http://localhost/room/ab12', '/')
assert(pathRoom.roomCode === 'AB12', '/room/:code survives a hard refresh')

const pathGame = readLocation('http://localhost/games/g/cue', '/games/')
assert(pathGame.gameId === 'cue', '/g/:id is read under the pages base')

const ignored = readLocation('http://localhost/g/not-a-game', '/')
assert(ignored.gameId === null, 'unknown game paths are ignored')

assert(appRootPath('/games/index.html', './') === '/games/', 'relative base stays on the project site')
assert(appRootPath('/g/trivia', '/') === '/', 'root base returns to /')

console.log('routes.test.ts passed')
