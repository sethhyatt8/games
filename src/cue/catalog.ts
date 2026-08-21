export type CueTrack = {
  id: string
  title: string
  cueLabel: string
  previewMs: number
  cueMs: number
  src?: string
  generated?: 'practice-a' | 'practice-b' | 'practice-c'
}

export const CUE_TRACKS: CueTrack[] = [
  {
    id: 'practice-a',
    title: 'Practice tone A',
    cueLabel: 'the click',
    previewMs: 4000,
    cueMs: 8000,
    generated: 'practice-a',
  },
  {
    id: 'practice-b',
    title: 'Practice tone B',
    cueLabel: 'the click',
    previewMs: 3500,
    cueMs: 10500,
    generated: 'practice-b',
  },
  {
    id: 'practice-c',
    title: 'Practice tone C',
    cueLabel: 'the click',
    previewMs: 5000,
    cueMs: 14000,
    generated: 'practice-c',
  },
  // Add your own songs in public/music, then:
  // { id: 'song-1', title: 'Whatever', src: '/music/song.mp3', previewMs: 4500, cueMs: 17200, cueLabel: 'the lyrics' },
]

export function trackById(id: string): CueTrack | undefined {
  return CUE_TRACKS.find((track) => track.id === id)
}

export function pickTrack(usedIds: string[]): CueTrack {
  const unused = CUE_TRACKS.filter((track) => !usedIds.includes(track.id))
  const pool = unused.length > 0 ? unused : CUE_TRACKS
  return pool[Math.floor(Math.random() * pool.length)]
}
