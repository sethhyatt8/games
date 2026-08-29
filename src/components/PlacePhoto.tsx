import { placePhotoUrl } from '../game/placePhoto'
import type { HiddenPlace } from '../game/protocol'

type PlacePhotoProps = {
  place: HiddenPlace | null
}

export function PlacePhoto({ place }: PlacePhotoProps) {
  if (!place?.photo) return null
  return (
    <figure className="place-photo">
      <img src={placePhotoUrl(place.photo)} alt={place.name} loading="lazy" />
      <figcaption>{place.name}</figcaption>
    </figure>
  )
}
