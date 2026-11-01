import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import type { BatchItem, BatchResponse } from "drizzle-orm/batch";
import "./env.server.ts";

/**
 * The database: Turso when TURSO_DATABASE_URL is set (with TURSO_AUTH_TOKEN),
 * otherwise a local SQLite file at data/bunpo.db. The app queries it through Drizzle (orm(), with the tables in
 * schema.server.ts); the SQL below creates and upgrades the tables.
 */

// Keyed by table, so an upgrade can make a table again from its current definition.
const SCHEMA = {
  // Tests and kanji chapters are everyone's; progress, reviewed, attempts and learned_words are each user's own.
  tests: `CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    position INTEGER, -- unused: the home list's drag order, before it sorted by title
    payload TEXT NOT NULL, -- TestPayload JSON
    submission TEXT, -- unused: moved to progress when progress became each user's
    draft TEXT -- unused: as submission
  )`,
  progress: `CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL REFERENCES users (id),
    test_id TEXT NOT NULL REFERENCES tests (id),
    submission TEXT, -- Submission JSON; NULL until taken
    draft TEXT, -- Draft JSON: the answers and checked parts of a test not submitted yet; NULL when there are none
    PRIMARY KEY (user_id, test_id)
  )`,
  reviewed: `CREATE TABLE IF NOT EXISTS reviewed (
    user_id INTEGER NOT NULL REFERENCES users (id),
    test_id TEXT NOT NULL REFERENCES tests (id),
    grammar_id TEXT NOT NULL,
    PRIMARY KEY (user_id, test_id, grammar_id)
  )`,
  attempts: `CREATE TABLE IF NOT EXISTS attempts (
    user_id INTEGER NOT NULL REFERENCES users (id),
    test_id TEXT NOT NULL REFERENCES tests (id),
    submitted_at TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    PRIMARY KEY (user_id, test_id, submitted_at) -- one row per submission; a retake keeps the earlier ones
  )`,
  users: `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE, -- "Huy" and "huy" are the same name
    password TEXT NOT NULL, -- "<salt hex>:<scrypt hash hex>"
    created_at TEXT NOT NULL,
    email TEXT, -- lower case; where a password reset link goes; NULL until the user adds one
    session_version INTEGER NOT NULL DEFAULT 0 -- in every login cookie; a password reset bumps it, which signs out the other devices
  )`,
  password_resets: `CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY, -- sha256 of the token in the emailed link; the token itself is never stored
    user_id INTEGER NOT NULL REFERENCES users (id),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`,
  kanji_chapters: `CREATE TABLE IF NOT EXISTS kanji_chapters (
    level TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    payload TEXT NOT NULL, -- KanjiChapter JSON: the chapter's words, for its flashcards
    updated_at TEXT NOT NULL,
    position INTEGER, -- unused: the kanji list's drag order, before it sorted by chapter
    PRIMARY KEY (level, chapter)
  )`,
  learned_words: `CREATE TABLE IF NOT EXISTS learned_words (
    user_id INTEGER NOT NULL REFERENCES users (id),
    word_id TEXT NOT NULL, -- wordId(): "n2-c1-贈答品"; a quiz miss deletes the row
    learned_at TEXT NOT NULL,
    PRIMARY KEY (user_id, word_id)
  )`,
};

/** Progress from before it was each user's goes to the oldest account, the app's owner. */
const OWNER = "(SELECT min(id) FROM users)";

/** Brings a database made by an older version up to date. Each step does nothing once it has run. */
async function migrate(client: Client) {
  const { rows } = await client.execute("PRAGMA table_info(users)");
  if (!rows.some((column) => column.name === "email")) await client.execute("ALTER TABLE users ADD COLUMN email TEXT");
  if (!rows.some((column) => column.name === "session_version"))
    await client.execute("ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0");
  const testColumns = (await client.execute("PRAGMA table_info(tests)")).rows;
  if (!testColumns.some((column) => column.name === "draft")) await client.execute("ALTER TABLE tests ADD COLUMN draft TEXT");
  const chapterColumns = (await client.execute("PRAGMA table_info(kanji_chapters)")).rows;
  if (!chapterColumns.some((column) => column.name === "position")) await client.execute("ALTER TABLE kanji_chapters ADD COLUMN position INTEGER");
  // Unique, but many users may have none: SQLite lets NULLs repeat in a unique index.
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email)");
  // Tables from before progress was each user's are made again with a user_id; with no account yet, their rows go.
  for (const table of ["reviewed", "attempts", "learned_words"] as const) {
    const columns = (await client.execute(`PRAGMA table_info(${table})`)).rows.map((column) => String(column.name));
    if (columns.includes("user_id")) continue;
    await client.batch(
      [
        `ALTER TABLE ${table} RENAME TO ${table}_shared`,
        SCHEMA[table],
        `INSERT INTO ${table} (user_id, ${columns}) SELECT ${OWNER}, ${columns} FROM ${table}_shared WHERE ${OWNER} IS NOT NULL`,
        `DROP TABLE ${table}_shared`,
      ],
      "write",
    );
  }
  // A result still in tests moves to the owner's progress: first as an attempt when it was saved before attempts were
  // kept (rows that can't be read are left out), then with its draft. Kept in tests until there is an account.
  await client.batch(
    [
      `INSERT OR IGNORE INTO attempts (user_id, test_id, submitted_at, score, total)
        SELECT ${OWNER}, id, json_extract(submission, '$.submittedAt'), json_extract(submission, '$.score'), json_extract(submission, '$.total')
        FROM tests WHERE json_valid(submission) AND ${OWNER} IS NOT NULL`,
      `INSERT OR IGNORE INTO progress (user_id, test_id, submission, draft)
        SELECT ${OWNER}, id, submission, draft FROM tests WHERE (submission IS NOT NULL OR draft IS NOT NULL) AND ${OWNER} IS NOT NULL`,
      `UPDATE tests SET submission = NULL, draft = NULL WHERE ${OWNER} IS NOT NULL`,
    ],
    "write",
  );
}

let ready: Promise<Client> | undefined;

type Orm = LibSQLDatabase & { $client: Client };
let wrapped: Orm | undefined;

/** Drizzle over the client below, for the app's typed queries. */
export async function orm(): Promise<Orm> {
  const client = await db();
  if (wrapped?.$client !== client) wrapped = drizzle(client);
  return wrapped;
}

/** Runs the statements as one transaction, in one round trip to the database. */
export async function write<T extends Readonly<[BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]>>(
  statements: T,
): Promise<BatchResponse<T>> {
  return (await orm()).batch(statements);
}

/** The client, with the tables created on first use. Tests and the table upgrades use it directly. */
export function db(): Promise<Client> {
  ready ??= connect().catch((error) => {
    ready = undefined; // Try again on the next request.
    throw error;
  });
  return ready;
}

async function connect() {
  let url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    const dir = path.resolve(process.env.DATA_DIR ?? "data");
    mkdirSync(dir, { recursive: true });
    url = `file:${path.join(dir, "bunpo.db")}`;
  }
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  await client.batch(Object.values(SCHEMA), "write");
  await migrate(client);
  return client;
}
