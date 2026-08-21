const databaseUrl = (process.env.VITE_FIREBASE_DATABASE_URL ?? '').replace(/\/$/, '')

if (!databaseUrl) {
  console.log('liveFlow.test.ts skipped (no VITE_FIREBASE_DATABASE_URL)')
  process.exit(0)
}

console.log('liveFlow.test.ts: set a Games Firebase URL before adding live room checks.')
