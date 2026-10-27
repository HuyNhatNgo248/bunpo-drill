# 文法ドリル

JLPT grammar mock tests made from your 文法ノート. Claude writes the questions with the
`jlpt-grammar-quiz` skill and POSTs them here. The app shows the test, keeps the answers
hidden until you submit, grades it on the server and shows what to review.

React Router 8 (framework mode, SSR) · TypeScript · Tailwind 4 · shadcn/ui · dnd-kit · Zod · Turso (libSQL).

## Run it

```sh
pnpm install
cp .env.example .env # then set APP_PASSWORD, SESSION_SECRET and BUNPO_API_TOKEN (Turso is optional)
pnpm dev             # http://localhost:3001, create an account with APP_PASSWORD as the code
pnpm test            # tests next to the files in app/lib, app/routes/helpers and app/components; a temp SQLite file per test file, never Turso
```

Then ask Claude for a test, for example `/jlpt-grammar-quiz 第5週 1〜3日目` or
`/jlpt-grammar-quiz weak ones 10 per section`.

## How a test gets in

1. The skill (`.claude/skills/jlpt-grammar-quiz/`) reads `~/Documents/JLPT 🇯🇵/<level>/<level> 文法 ノート/`
   and writes a payload: 15 fill-blank, 15 sentence-order and 3 passages × 5 blanks by default.
2. `post.sh` checks it against `schema.json`, then POSTs it to `/api/tests`.
3. The server validates it again (shape plus cross-field rules) and saves it.

The payload format is defined once, in `app/lib/payload.ts` (Zod). `pnpm schema`
regenerates the skill's `schema.json` from it, and `pnpm test` fails if they drift.

## Sign-in

Accounts, in `app/lib/auth.server.ts` and `app/lib/users.server.ts`. Everyone signs up at
`/login?mode=signup` with a username, an email, a password and the sign-up code (`APP_PASSWORD`), so
only people you give the code to can get in. All users see the same tests.

A root middleware checks every request: without the login cookie, pages redirect to `/login` and
`/api` answers 401. Signing in sets a cookie signed with `SESSION_SECRET` for 30 days. `/account`
changes your username, email or password and has ログアウト. Changing `SESSION_SECRET` signs everyone out.

Forgot password (`app/lib/password-reset.server.ts`): `/login` links to `/forgot-password`, which
emails a link to `/reset-password` that works once, for an hour. The page answers the same whether
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

Pages: `/login`, `/account`, `/` (mock tests), `/tests/:id` (quiz), `/tests/:id/results`.

## Storage

A libSQL (SQLite) database, set up in `app/lib/db.server.ts`:

- **Turso** when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set, in `.env` locally
  (gitignored) or in the host's settings when deployed.
- **`data/bunpo.db`** otherwise, a local file (gitignored; set `DATA_DIR` to move it).

The tables are created on first use. `tests` has a row per test (payload and last submission as
JSON, plus `position`, the place you dragged it to in the list; new tests have none and show
first, newest first). `reviewed` has a row per review chip marked reviewed. `users` has the accounts (passwords as
salted scrypt hashes, in `app/lib/users.server.ts`). All queries are in
`app/lib/tests.server.ts`.

## Theme

Every color is a token in `app/tailwind.css` (`--primary`, `--primary-soft`,
`--success`, `--warning`, `--muted-foreground`, …). Components use the semantic utilities
(`bg-primary`, `text-success`, `border-primary-border`) and never raw palette colors.
