/** Wikimedia Commons image via Special:FilePath (stable CDN redirect). */
export function placePhotoUrl(filename: string): string {
  const normalized = filename.trim().replace(/ /g, '_')
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(normalized)}?width=960`
}
