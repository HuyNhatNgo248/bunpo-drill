# 文法ドリル

JLPT grammar mock tests made from your 文法ノート. Claude writes the questions with the
`jlpt-grammar-quiz` skill and POSTs them here. The app shows the test, keeps the answers
hidden until you submit, grades it on the server and shows what to review.

React Router 8 (framework mode, SSR) · TypeScript · Tailwind 4 · shadcn/ui · dnd-kit · Zod · Turso (libSQL).

## Run it

```sh
pnpm install
cp .env.example .env # then set APP_PASSWORD, SESSION_SECRET and BUNPO_API_TOKEN (Turso is optional)
pnpm dev             # http://localhost:3001, sign in with APP_PASSWORD
```

Then ask Claude for a test, for example `/jlpt-grammar-quiz 第5週 1〜3日目` or
`/jlpt-grammar-quiz weak ones 10 per section`.

## How a test gets in

1. The skill (`.claude/skills/jlpt-grammar-quiz/`) reads `~/Documents/JLPT 🇯🇵/<level>/<level> 文法 ノート/`
   and writes a payload: 15 fill-blank, 15 sentence-order and 3 passages × 5 blanks by default.
2. `post.sh` checks it against `schema.json`, then POSTs it to `/api/tests`.
3. The server validates it again (shape plus cross-field rules) and saves it.

The payload format is defined once, in `app/lib/payload.ts` (Zod). `pnpm schema`
regenerates the skill's `schema.json` from it, and `pnpm typecheck` fails if they drift.

## Sign-in

One password for one person, in `app/lib/auth.server.ts`. A root middleware checks every request:
without the login cookie, pages redirect to `/login` and `/api` answers 401. Signing in with
`APP_PASSWORD` sets a cookie signed with `SESSION_SECRET` for 30 days; ログアウト on the home page
clears it, and changing `SESSION_SECRET` signs everyone out.

The quiz skill has no cookie, so `/api` also accepts `Authorization: Bearer <BUNPO_API_TOKEN>`.
`post.sh` and `tests.sh` read the token from `.env` (or `BUNPO_API_TOKEN` in the environment).

## API

All need the login cookie or `Authorization: Bearer <BUNPO_API_TOKEN>`; without either, 401.

| Method | Path | Does |
|---|---|---|
| `POST` | `/api/tests` | Save a test. 201 → `{ id, url }`; 400 → `{ error, issues: [{ path, message }] }` |
| `GET` | `/api/tests` | All tests with last score and grammar to review |
| `PATCH` | `/api/tests` | `{ order: [id, …] }`: set the list order, top first (what dragging on `/` does) |
| `DELETE` | `/api/tests` | Clear all tests |
| `PATCH` | `/api/tests/:id` | `{ grammarId, reviewed }`: mark a review chip |
| `DELETE` | `/api/tests/:id` | Delete one test |

Pages: `/login`, `/` (mock tests), `/tests/:id` (quiz), `/tests/:id/results`.

## Live answers

Open the same `/tests/:id` on two devices (both signed in), for example yours and your teacher's:
an answer picked on one shows up on the other right away. A page opened later takes the answers so
far; submitting or retaking starts the next attempt blank.

Each quiz page sends its answers over a WebSocket to `/live/:id`; `app/lib/live.server.ts` passes
them to every page on that test and keeps the last ones in memory. So the app needs one long-running
Node server (`server.ts`, used by `pnpm dev` and `pnpm start`); serverless hosts like Vercel can't
hold WebSockets.

## Storage

A libSQL (SQLite) database, set up in `app/lib/db.server.ts`:

- **Turso** when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set, in `.env` locally
  (gitignored) or in the host's settings when deployed.
- **`data/bunpo.db`** otherwise, a local file (gitignored; set `DATA_DIR` to move it).

The tables are created on first use. `tests` has a row per test (payload and last submission as
JSON, plus `position`, the place you dragged it to in the list; new tests have none and show
first, newest first). `reviewed` has a row per review chip marked reviewed. All queries are in
`app/lib/tests.server.ts`.

`pnpm db:import` copies tests from the old file storage (`data/tests/<id>.json` and
`data/order.json`) into whichever database `.env` points at. Running it again skips tests that
are already there; once they're in, the old files can be deleted.

## Theme

Every color is a token in `app/tailwind.css` (`--primary`, `--primary-soft`,
`--success`, `--warning`, `--muted-foreground`, …). Components use the semantic utilities
(`bg-primary`, `text-success`, `border-primary-border`) and never raw palette colors.
