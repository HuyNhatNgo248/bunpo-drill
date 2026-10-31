# 文法ドリル

JLPT grammar mock tests made from your 文法ノート, and kanji flashcards and mock tests made from
漢字マスターN2. Claude writes the questions with the `jlpt-grammar-quiz` and `jlpt-kanji-quiz`
skills and POSTs them here. The app shows the test, keeps the answers hidden until you submit,
grades it on the server and shows what to review.

React Router 8 (framework mode, SSR) · TypeScript · Tailwind 4 · shadcn/ui · dnd-kit · Zod · Turso (libSQL).

## Run it

```sh
pnpm install
cp .env.example .env # then set SESSION_SECRET and BUNPO_API_TOKEN (Turso is optional)
pnpm dev             # http://localhost:3001, then create an account
pnpm test            # tests next to the files in app/lib and app/components, route tests in app/routes/__tests__ and app/routes/helpers/__tests__; a temp SQLite file per test file, never Turso
```

Then ask Claude for a test, for example `/jlpt-grammar-quiz 第5週 1〜3日目` or
`/jlpt-grammar-quiz weak ones 10 per section`, or for a kanji chapter's flashcards and test with
`/jlpt-kanji-quiz 1章`. The kanji skill reads the book's scanned pages, which needs poppler
(`brew install poppler`).

## Deploy

The `Dockerfile` builds the app and runs `pnpm start` on port 3001. Set these on the host
(see `.env.example` for what each one is):

- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. A container's disk is wiped on every deploy, so
  without Turso every test and account is lost.
- `SESSION_SECRET`: a new long random string, not the one in your local `.env`.
- `BUNPO_API_TOKEN`, so the quiz skill can post tests.
- `APP_URL`: the address people open the app at. Password reset links start with it.
- `RESEND_API_KEY` and `MAIL_FROM`: password reset emails go out through
  [Resend](https://resend.com), from a sender on a domain verified there. In dev, without the key,
  each email is printed to the server log. In production, without them, the forgot-password page fails.

Then point the quiz skill at the deployed app: set `BUNPO_URL` to its address and `BUNPO_API_TOKEN`
to the same token in your shell.

## How a test gets in

1. The skill (`.claude/skills/jlpt-grammar-quiz/`) reads `~/Documents/JLPT 🇯🇵/<level>/<level> 文法 ノート/`
   and writes a payload: 15 fill-blank, 15 sentence-order and 3 passages × 5 blanks by default.
2. `post.sh` checks it against `schema.json`, then POSTs it to `/api/tests`.
3. The server validates it again (shape plus cross-field rules) and saves it.

The payload format is defined once, in `app/lib/payload.ts` (Zod). `pnpm schema`
regenerates the skill's `schema.json` from it, and `pnpm test` fails if they drift.

## How kanji gets in

1. The skill (`.claude/skills/jlpt-kanji-quiz/`) reads a chapter's notes in
   `~/Documents/JLPT 🇯🇵/N2/N2 漢字 ノート/`, writing them from the book's pages first when they're missing.
2. `post.sh chapter` sends the chapter's words to `/api/kanji/chapters`: they are its flashcards at
   `/kanji/:level/:chapter/cards`.
3. `post.sh test` sends a test on that chapter (5 漢字読み + 5 表記 by default) to `/api/tests`, which
   checks that each of its words is in the chapter.

Both formats are in `app/lib/kanji-payload.ts`; `pnpm schema` writes the skill's `chapter.schema.json`
and `test.schema.json`. A flashcard got right the first time marks its word learned; a word the
quiz gets wrong loses the mark, so it comes back first.

## Sign-in

Accounts, in `app/lib/auth.server.ts` and `app/lib/users.server.ts`. Everyone signs up at
`/signup` with a username, an email and a password, and sign in at `/signin`. Anyone who finds the site can make an account. All users see the same tests.

A root middleware checks every request: without the login cookie, `/` redirects to `/welcome`, other pages to `/signin`, and
`/api` answers 401. Signing in sets a cookie signed with `SESSION_SECRET` for 30 days. `/account`
changes your username, email or password and has ログアウト. Changing `SESSION_SECRET` signs everyone out.

Forgot password (`app/lib/password-reset.server.ts`): `/signin` links to `/forgot-password`, which
emails a link to `/reset-password` that works once, for an hour. A reset signs out every other device.
The page answers the same whether
or not an account has the email. Only a hash of each link's token is stored. Emails go out through
[Resend](https://resend.com) (`RESEND_API_KEY`, `MAIL_FROM`) and the link starts with `APP_URL`; see
`.env.example`. Without the key, `pnpm dev` prints each email to the server log. Accounts made before
emails existed add theirs on `/account`.

The quiz skill has no cookie, so `/api` also accepts `Authorization: Bearer <BUNPO_API_TOKEN>`.
`post.sh` and `tests.sh` read the token from `.env` (or `BUNPO_API_TOKEN` in the environment).

## API

All need the login cookie or `Authorization: Bearer <BUNPO_API_TOKEN>`; without either, 401.

| Method | Path | Does |
| --- | --- | --- |
| `POST` | `/api/tests` | Save a test. 201 → `{ id, url }`; 400 → `{ error, issues: [{ path, message }] }` |
| `GET` | `/api/tests` | All tests with last score and grammar to review |
| `PATCH` | `/api/tests` | `{ order: [id, …] }`: set the list order, top first (what dragging on `/` does) |
| `DELETE` | `/api/tests` | Clear all tests |
| `PATCH` | `/api/tests/:id` | `{ grammarId, reviewed }`: mark a review chip |
| `DELETE` | `/api/tests/:id` | Delete one test |
| `POST` | `/api/kanji/chapters` | Save (or replace) a kanji chapter's words. 201 → `{ level, chapter, words, url }`; 400 → `{ error, issues }` |

`POST /api/tests` takes a kanji test too (`"kind": "kanji"`); `GET /api/tests` and the list on `/`
show only grammar tests.

Pages: `/welcome` (for signed-out visitors, with 3 sample questions), `/signin`, `/signup` (old `/login` links redirect to them), `/account`, `/` (mock tests), `/kanji` (kanji chapters), `/kanji/:level/:chapter/cards` (flashcards), `/tests/:id` (quiz), `/tests/:id/results`.

## Storage

A libSQL (SQLite) database, set up in `app/lib/db.server.ts`:

- **Turso** when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set, in `.env` locally
  (gitignored) or in the host's settings when deployed.
- **`data/bunpo.db`** otherwise, a local file (gitignored; set `DATA_DIR` to move it).

The tables are created on first use. `tests` has a row per test (payload and last submission as
JSON, plus `position`, the place you dragged it to in the list; new tests have none and show
first, newest first). `reviewed` has a row per review chip marked reviewed. `attempts` has the score of every
submission, so a retake keeps the earlier ones. `users` has the accounts (passwords as
salted scrypt hashes, in `app/lib/users.server.ts`). `kanji_chapters` has a row per kanji
chapter (its words as JSON), and `learned_words` a row per word marked learned; like the tests, they
are the same for every user. The test queries are in `app/lib/tests.server.ts`, the kanji ones in
`app/lib/kanji.server.ts`.

## Theme

Every color is a token in `app/tailwind.css` (`--primary`, `--primary-soft`,
`--success`, `--warning`, `--muted-foreground`, …). Components use the semantic utilities
(`bg-primary`, `text-success`, `border-primary-border`) and never raw palette colors.
