# Games

Party rooms for phone-in-hand group games. First title: **Where in the World is Steven San Francisco**.

A place is named. Everyone drops a pin. When time is up, the map shows every guess and a miles-away leaderboard. Lowest total miles wins.

The room layer (create a code, join on your own phone, host starts) is copied from [Artists](https://github.com/sethhyatt8/artists). Keep working on collage in that repo. This one is the games hub.

Stack: React + Vite + TypeScript on GitHub Pages, with Firebase Realtime Database for live rooms.

## Run locally

```bash
npm install
```

Rooms use the same Firebase project as Artists, under a `games/` path, so the two apps do not share rooms. `.env` is already set for local play.

```bash
npm run dev
```

Open the Vite URL on your laptop and phones on the same Wi-Fi.

## Scripts

- `npm run dev` — web app
- `npm run test` — room logic
- `npm run build` / `npm run lint`
