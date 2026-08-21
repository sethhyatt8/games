export type Place = {
  id: string
  name: string
  category: 'City' | 'Landmark' | 'Nature'
  lat: number
  lng: number
}

export const PLACES: Place[] = [
  { id: 'sf', name: 'San Francisco', category: 'City', lat: 37.7749, lng: -122.4194 },
  { id: 'golden-gate', name: 'Golden Gate Bridge', category: 'Landmark', lat: 37.8199, lng: -122.4783 },
  { id: 'nyc', name: 'New York City', category: 'City', lat: 40.7128, lng: -74.006 },
  { id: 'liberty', name: 'Statue of Liberty', category: 'Landmark', lat: 40.6892, lng: -74.0445 },
  { id: 'grand-canyon', name: 'Grand Canyon', category: 'Nature', lat: 36.1069, lng: -112.1129 },
  { id: 'yellowstone', name: 'Yellowstone National Park', category: 'Nature', lat: 44.428, lng: -110.5885 },
  { id: 'hollywood', name: 'Hollywood Sign', category: 'Landmark', lat: 34.1341, lng: -118.3215 },
  { id: 'space-needle', name: 'Space Needle', category: 'Landmark', lat: 47.6205, lng: -122.3493 },
  { id: 'niagara', name: 'Niagara Falls', category: 'Nature', lat: 43.0962, lng: -79.0377 },
  { id: 'mexico-city', name: 'Mexico City', category: 'City', lat: 19.4326, lng: -99.1332 },
  { id: 'chichen-itza', name: 'Chichén Itzá', category: 'Landmark', lat: 20.6843, lng: -88.5678 },
  { id: 'machu-picchu', name: 'Machu Picchu', category: 'Landmark', lat: -13.1631, lng: -72.545 },
  { id: 'rio', name: 'Rio de Janeiro', category: 'City', lat: -22.9068, lng: -43.1729 },
  { id: 'redeemer', name: 'Christ the Redeemer', category: 'Landmark', lat: -22.9519, lng: -43.2105 },
  { id: 'easter-island', name: 'Easter Island', category: 'Landmark', lat: -27.1127, lng: -109.3497 },
  { id: 'london', name: 'London', category: 'City', lat: 51.5074, lng: -0.1278 },
  { id: 'big-ben', name: 'Big Ben', category: 'Landmark', lat: 51.5007, lng: -0.1246 },
  { id: 'paris', name: 'Paris', category: 'City', lat: 48.8566, lng: 2.3522 },
  { id: 'eiffel', name: 'Eiffel Tower', category: 'Landmark', lat: 48.8584, lng: 2.2945 },
  { id: 'rome', name: 'Rome', category: 'City', lat: 41.9028, lng: 12.4964 },
  { id: 'colosseum', name: 'Colosseum', category: 'Landmark', lat: 41.8902, lng: 12.4922 },
  { id: 'venice', name: 'Venice', category: 'City', lat: 45.4408, lng: 12.3155 },
  { id: 'barcelona', name: 'Sagrada Família', category: 'Landmark', lat: 41.4036, lng: 2.1744 },
  { id: 'athens', name: 'Acropolis of Athens', category: 'Landmark', lat: 37.9715, lng: 23.7267 },
  { id: 'santorini', name: 'Santorini', category: 'City', lat: 36.3932, lng: 25.4615 },
  { id: 'reykjavik', name: 'Reykjavík', category: 'City', lat: 64.1466, lng: -21.9426 },
  { id: 'prague', name: 'Prague', category: 'City', lat: 50.0755, lng: 14.4378 },
  { id: 'moscow', name: 'Red Square', category: 'Landmark', lat: 55.7539, lng: 37.6208 },
  { id: 'cairo', name: 'Giza Pyramids', category: 'Landmark', lat: 29.9792, lng: 31.1342 },
  { id: 'petra', name: 'Petra', category: 'Landmark', lat: 30.3285, lng: 35.4444 },
  { id: 'marrakesh', name: 'Marrakesh', category: 'City', lat: 31.6295, lng: -7.9811 },
  { id: 'victoria-falls', name: 'Victoria Falls', category: 'Nature', lat: -17.9243, lng: 25.8572 },
  { id: 'table-mountain', name: 'Table Mountain', category: 'Nature', lat: -33.9628, lng: 18.4098 },
  { id: 'kilimanjaro', name: 'Mount Kilimanjaro', category: 'Nature', lat: -3.0674, lng: 37.3556 },
  { id: 'timbuktu', name: 'Timbuktu', category: 'City', lat: 16.7666, lng: -3.0026 },
  { id: 'istanbul', name: 'Hagia Sophia', category: 'Landmark', lat: 41.0086, lng: 28.9802 },
  { id: 'dubai', name: 'Burj Khalifa', category: 'Landmark', lat: 25.1972, lng: 55.2744 },
  { id: 'taj-mahal', name: 'Taj Mahal', category: 'Landmark', lat: 27.1751, lng: 78.0421 },
  { id: 'everest', name: 'Mount Everest', category: 'Nature', lat: 27.9881, lng: 86.925 },
  { id: 'angkor', name: 'Angkor Wat', category: 'Landmark', lat: 13.4125, lng: 103.867 },
  { id: 'great-wall', name: 'Great Wall of China', category: 'Landmark', lat: 40.4319, lng: 116.5704 },
  { id: 'tokyo', name: 'Tokyo', category: 'City', lat: 35.6762, lng: 139.6503 },
  { id: 'fuji', name: 'Mount Fuji', category: 'Nature', lat: 35.3606, lng: 138.7274 },
  { id: 'kyoto', name: 'Fushimi Inari Shrine', category: 'Landmark', lat: 34.9671, lng: 135.7727 },
  { id: 'sydney', name: 'Sydney Opera House', category: 'Landmark', lat: -33.8568, lng: 151.2153 },
  { id: 'uluru', name: 'Uluru', category: 'Nature', lat: -25.3444, lng: 131.0369 },
  { id: 'auckland', name: 'Auckland', category: 'City', lat: -36.8509, lng: 174.7645 },
  { id: 'banff', name: 'Banff', category: 'Nature', lat: 51.1784, lng: -115.5708 },
  { id: 'havana', name: 'Havana', category: 'City', lat: 23.1136, lng: -82.3666 },
  { id: 'moai', name: 'Ahu Tongariki', category: 'Landmark', lat: -27.1259, lng: -109.2769 },
]

export function placeById(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id)
}

export function pickPlace(usedIds: string[]): Place {
  const unused = PLACES.filter((place) => !usedIds.includes(place.id))
  const pool = unused.length > 0 ? unused : PLACES
  return pool[Math.floor(Math.random() * pool.length)]
}
