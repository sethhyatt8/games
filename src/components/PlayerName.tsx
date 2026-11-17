import { CharacterAvatar } from './CharacterAvatar'

type PlayerNameProps = {
  name: string
  characterId?: string
  you?: boolean
  size?: number
}

export function PlayerName({ name, characterId, you = false, size = 36 }: PlayerNameProps) {
  return (
    <span className="player-name">
      <CharacterAvatar characterId={characterId} name={name} size={size} />
      <span>
        {name}
        {you ? ' (you)' : ''}
      </span>
    </span>
  )
}
