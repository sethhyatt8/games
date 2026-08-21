# Games

Multiplayer party-games hub. This repo is a copy of the [Artists](https://github.com/sethhyatt8/artists) room layer so we can keep shipping `/artists` on its own.

Stack: React + Vite + TypeScript on GitHub Pages, with live rooms (Firebase Realtime Database today; PartyKit files are leftover from an earlier pass).

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and put in a **new** Firebase Realtime Database URL. Do not reuse the Artists database, or the two apps will share rooms.

- Web: http://localhost:5173

Open the site on your laptop and on phones on the same Wi-Fi using your computer’s LAN address (Vite prints it). Each device can create or join with the room code. No player accounts.

## Play on the internet

1. **Web app** — GitHub Pages (`.github/workflows/deploy-pages.yml`).
2. **Rooms** — add repo secret `VITE_FIREBASE_DATABASE_URL` for this app’s own Firebase project.

Artists stays at https://sethhyatt8.github.io/artists. This app will be https://sethhyatt8.github.io/games once Pages is enabled.

## Scripts

- `npm run dev` — web app
- `npm run build` / `npm run lint`
- `npm run deploy` — GitHub Pages via `gh-pages`
