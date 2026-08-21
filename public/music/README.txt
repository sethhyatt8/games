Drop your own mp3/m4a files in this folder, then add them to src/cue/catalog.ts:

{
  id: 'song-1',
  title: 'Whatever You Want To Call It',
  src: '/music/song.mp3',
  previewMs: 4500,
  cueMs: 17200,
  cueLabel: 'the lyrics',
}

previewMs is how long the clip plays before it fades.
cueMs is the real answer, in milliseconds from the start of the file.
