import { MAX_PLAYERS, type Player } from '../game/protocol'

type PlayerRosterProps = {
  players: Player[]
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
            <span>
              {player.name}
              {player.id === selfId ? ' (you)' : ''}
            </span>
            <span className="player-tags">
              {player.id === hostId ? <span className="tag">Host</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
