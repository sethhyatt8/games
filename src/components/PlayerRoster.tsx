import { PlayerName } from './PlayerName'
import { MAX_PLAYERS } from '../game/protocol'

type RosterPlayer = {
  id: string
  name: string
  characterId?: string
}

type PlayerRosterProps = {
  players: RosterPlayer[]
  selfId: string
  hostId: string | null
}

export function PlayerRoster({ players, selfId, hostId }: PlayerRosterProps) {
  return (
    <section className="player-roster">
      <h2 className="player-roster-heading">
        Players
        <span className="player-count">
          {players.length} / {MAX_PLAYERS}
        </span>
      </h2>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.id}>
            <PlayerName
              name={player.name}
              characterId={player.characterId}
              you={player.id === selfId}
            />
            <span className="player-tags">
              {player.id === hostId ? <span className="tag">Host</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
