# Games

Party rooms for phone-in-hand group games. The host creates a room code, everyone joins on their own phone, and the host starts.

Titles:

- **Where in the World is Steven San Francisco** — a place is named, everyone drops a pin, fewest miles wins.
- **Sing in Your Head** — hear the start of a song, then tap when you think the cue happens.
- **Trivia** — the host picks one or more rounds. Questions show on every phone with a timer. Highest score wins.

The room layer is copied from [Artists](https://github.com/sethhyatt8/artists). Keep working on collage in that repo. This one is the games hub.

Stack: React + Vite + TypeScript. Live rooms use Firebase Realtime Database, under a `games/` path, so they do not mix with Artists rooms.

`party/` and `partykit.json` are leftovers from the Artists collage server. Nothing in the app connects to them (`party/server.ts` imports modules this repo does not have, and `getPartyKitHost` is unused). Do not deploy PartyKit for this app.

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` if you need to point at a database. `.env` is gitignored. The example only contains the public Realtime Database URL — no API keys or tokens.

Open the Vite URL on your laptop and on phones on the same Wi-Fi.

## Scripts

- `npm run dev` — web app
- `npm run test` — room logic, including trivia scoring
- `npm run lint`
- `npm run build` — GitHub Pages build (relative asset paths)
- `npm run build:hostinger` — domain-root build for Hostinger
- `npm run deploy` — publish the GitHub Pages build with `gh-pages`

## GitHub Pages

The default build sets Vite `base` to `./`, which is what the project site needs. `.github/workflows/deploy-pages.yml` runs `npm run build` and is unchanged.

```bash
npm run build
npm run deploy
```

Output folder: `dist/`.

To build for a different subpath without editing the config, set `VITE_BASE_PATH` (include the trailing slash):

```bash
VITE_BASE_PATH=/games/ npm run build
```

## Hostinger (domain root)

The Hostinger site is served from the root of its own domain (a temporary domain first, a custom domain later), not from `/games/`.

```bash
npm run build:hostinger
```

That runs `vite build --base /`, so scripts, styles, and avatars load from `/` even if the address bar is a client route such as `/g/trivia`.

Output folder: **`dist/`**. Upload the **contents** of `dist/` into the site’s `public_html` (the domain root). Include the hidden `.htaccess`.

That `.htaccess` is Apache’s fallback: any path that is not a real file is served `index.html`. A hard refresh of `/g/trivia` or `/room/K7QM` still loads the app. Existing files (`assets/`, `avatars/`, `favicon.svg`) are served as themselves. GitHub Pages ignores `.htaccess`, so leaving it in the Pages artifact is harmless.

The app also keeps working with query links, which refresh on any host: `/?room=K7QM&game=trivia`.

`VITE_BASE_PATH=/` is the same root-domain build if you would rather not use the script.

## Firebase for a new domain

The client talks to Realtime Database over its public REST URL (`VITE_FIREBASE_DATABASE_URL`). It does not use Firebase Auth, the Firebase JS SDK, or an API key.

You do **not** need to add the Hostinger domain under Authentication → Authorized domains for this app. Database rules are not filtered by website domain. The rules that already allow GitHub Pages to read and write `games/` allow the new domain too.

If you later turn on Firebase App Check, or switch the client to Firebase Auth, register the Hostinger domain (and the custom domain when you add one) in those products.

No secrets belong in git. `.env` and `.env.production` are gitignored. Do not commit database secrets, service accounts, or API tokens. The URL in `.env.example` and the Pages workflow is the public database address, not a credential.

## Avatars

Player portraits are the set from Artists, copied into this repo:

- images: `public/avatars/`
- who they are: `src/game/characters.ts`
- the portrait component: `src/components/CharacterAvatar.tsx`

On the hub, everyone picks a character (or Guest). The pick is saved in this site’s localStorage as `games-character-id`. If that key is empty, the hub will read an existing `artists-character-id` once, and from then on it only writes the games key. Avatars show in the lobby, on leaderboards, and on map pins.

## Add a game

`src/game/games.ts` is the registry (the cards on the hub). A new game needs:

1. A stable `gameId` stored on the room document.
2. Room logic that can create, join, start, and score (trivia and the map game are the patterns).
3. A card in `GAMES`.
4. A branch in `RoomGate` inside `src/App.tsx` that mounts the screen.

Phones that only have the room code read `gameId` from Firebase and open the matching screen.

## Add a trivia round

Rounds are data. The engine does not have a category list of its own. Edit **`src/trivia/rounds.ts`** and add an object to `TRIVIA_ROUNDS`. The placeholder round in that file is dummy data for testing — three obvious questions, one of each kind, flagged `placeholder: true`. Delete it when you don’t want it, or leave it. The lobby badges it “test only” and stops pre-selecting placeholder rounds once any real round exists.

```ts
{
  id: 'geography',          // kebab-case, unique, stored in the room
  title: 'Geography',
  blurb: 'One line for the lobby.',
  // placeholder: true,     // only for sample data
  questions: [
    {
      id: 'capital',
      kind: 'choice',       // multiple choice
      prompt: 'What is the capital of France?',
      choices: ['Paris', 'Lyon', 'Nantes'],  // 2–6
      answer: 0,            // index into choices
      note: 'Optional line shown after the question.',
    },
    {
      id: 'ocean',
      kind: 'boolean',      // true / false
      prompt: 'The Pacific is the largest ocean.',
      answer: true,
    },
    {
      id: 'year',
      kind: 'number',       // closest number
      prompt: 'In what year did the Berlin Wall fall?',
      answer: 1989,
      unit: 'year',         // optional, shown next to the answer
    },
  ],
}
```

Rules the tests enforce:

- Round and question ids are unique kebab-case (`geography`, `berlin-wall`).
- Every round has a title and at least one question.
- Choice questions have 2–6 non-empty choices and an `answer` index that lands on one.
- Boolean `answer` is `true` or `false`.
- Number `answer` is a finite number.

The host picks rounds in the lobby. Selection order is play order. Each question uses the host’s timer (15, 20, 30, or 45 seconds). Players can change an answer until they lock. When everyone has locked, or the timer ends, the question scores.

Scoring (higher is better):

- **Choice and true/false.** 1000 points if right, plus up to 500 for speed (500 if you answer as it opens, 0 at the buzzer). Wrong or blank is 0.
- **Closest number.** 1000 plus the same speed bonus if exact. Otherwise `round(1000 × closeness)`, where closeness is 1 on the answer and 0 once the guess is a full `|answer|` away (or 1 away, when the answer is 0). No speed bonus unless the number is exact. Everyone is scored against the answer, not against each other.
- After each question the room shows what people answered, the points they just earned, and the running total. Highest total wins. A tie shares the win.

Question text and the right answers ship in the client (it is a party game, not a locked exam). The room state still hides the correct answer and other players’ answers until the reveal.
