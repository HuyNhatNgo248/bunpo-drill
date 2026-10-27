import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
// With the extension: scripts/import-files.ts runs this file in plain Node.
import "./env.server.ts";

/**
 * The database: Turso when TURSO_DATABASE_URL is set (with TURSO_AUTH_TOKEN),
 * otherwise a local SQLite file at data/bunpo.db.
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
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE, -- shown on notes; "Huy" and "huy" are the same name
    password TEXT NOT NULL, -- "<salt hex>:<scrypt hash hex>"
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    test_id TEXT NOT NULL REFERENCES tests (id),
    question_id TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users (id),
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
];

let ready: Promise<Client> | undefined;

/** The client, with the tables created on first use. */
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
  return client;
}
