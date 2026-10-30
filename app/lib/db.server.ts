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

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    position INTEGER, -- place in the home list, set by dragging; NULL until dragged
    payload TEXT NOT NULL, -- TestPayload JSON
    submission TEXT -- Submission JSON; NULL until taken
  )`,
  `CREATE TABLE IF NOT EXISTS reviewed (
    test_id TEXT NOT NULL REFERENCES tests (id),
    grammar_id TEXT NOT NULL,
    PRIMARY KEY (test_id, grammar_id)
  )`,
  `CREATE TABLE IF NOT EXISTS attempts (
    test_id TEXT NOT NULL REFERENCES tests (id),
    submitted_at TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    PRIMARY KEY (test_id, submitted_at) -- one row per submission; a retake keeps the earlier ones
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE, -- "Huy" and "huy" are the same name
    password TEXT NOT NULL, -- "<salt hex>:<scrypt hash hex>"
    created_at TEXT NOT NULL,
    email TEXT, -- lower case; where a password reset link goes; NULL until the user adds one
    session_version INTEGER NOT NULL DEFAULT 0 -- in every login cookie; a password reset bumps it, which signs out the other devices
  )`,
  `CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY, -- sha256 of the token in the emailed link; the token itself is never stored
    user_id INTEGER NOT NULL REFERENCES users (id),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`,
];

/** Brings a database made by an older version up to date. Each step does nothing once it has run. */
async function migrate(client: Client) {
  const { rows } = await client.execute("PRAGMA table_info(users)");
  if (!rows.some((column) => column.name === "email")) await client.execute("ALTER TABLE users ADD COLUMN email TEXT");
  if (!rows.some((column) => column.name === "session_version"))
    await client.execute("ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0");
  // Unique, but many users may have none: SQLite lets NULLs repeat in a unique index.
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email)");
  // A result saved before attempts were kept becomes its test's first attempt. Rows that can't be read are left out.
  await client.execute(`INSERT OR IGNORE INTO attempts (test_id, submitted_at, score, total)
    SELECT id, json_extract(submission, '$.submittedAt'), json_extract(submission, '$.score'), json_extract(submission, '$.total')
    FROM tests WHERE json_valid(submission)`);
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
  await client.batch(SCHEMA, "write");
  await migrate(client);
  return client;
}
