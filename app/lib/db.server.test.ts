import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/** The tables that the app reads and writes. */
const TABLES = ["attempts", "kanji_chapters", "learned_words", "notes", "password_resets", "progress", "reviewed", "tests", "users"];

/** The users table from before emails and session versions. */
const OLD_USERS = "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, password TEXT NOT NULL, created_at TEXT NOT NULL)";

/**
 * A fresh copy of db.server.ts. The module keeps one client for the life of the process,
 * so a test that checks how the client is made must load the module again.
 */
async function loadDb() {
  vi.resetModules();
  return (await import("./db.server")).db;
}

async function tableNames(db: Awaited<ReturnType<typeof loadDb>>) {
  const { rows } = await (await db()).execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  return rows.map((row) => row.name);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("db", () => {
  it("creates the tables on first use", async () => {
    expect(await tableNames(await loadDb())).toEqual(TABLES);
  });

  it("opens data/bunpo.db in DATA_DIR when no Turso URL is set", async () => {
    await (await loadDb())();

    expect(existsSync(path.join(process.env.DATA_DIR!, "bunpo.db"))).toBe(true);
  });

  it("gives the same client to every caller", async () => {
    const db = await loadDb();

    expect(await db()).toBe(await db());
  });

  it("keeps the rows when the app starts again, because it only creates missing tables", async () => {
    const first = await loadDb();
    await (await first()).execute("INSERT INTO users (name, password, created_at) VALUES ('kept', 'x', 'now')");

    const { rows } = await (await (await loadDb())()).execute("SELECT name FROM users WHERE name = 'kept'");

    expect(rows).toHaveLength(1);
  });

  it("adds the email column and its unique index to a users table from before emails", async () => {
    const dir = path.join(process.env.DATA_DIR!, "old");
    mkdirSync(dir);
    vi.stubEnv("DATA_DIR", dir);
    const { createClient } = await import("@libsql/client");
    const old = createClient({ url: `file:${path.join(dir, "bunpo.db")}` });
    await old.execute(OLD_USERS);
    await old.execute("INSERT INTO users (name, password, created_at) VALUES ('Huy', 'x', 'now')");
    old.close();

    const client = await (await loadDb())();

    const { rows } = await client.execute("SELECT name, email FROM users");
    expect(rows.map((row) => ({ ...row }))).toEqual([{ name: "Huy", email: null }]);
    await client.execute("UPDATE users SET email = 'huy@example.com'");
    await client.execute("INSERT INTO users (name, password, created_at) VALUES ('Mai', 'x', 'now')");
    await expect(client.execute("UPDATE users SET email = 'huy@example.com' WHERE name = 'Mai'")).rejects.toThrow(/UNIQUE/);
  });

  it("adds the anchor column to a notes table from before it, keeping the notes", async () => {
    const dir = path.join(process.env.DATA_DIR!, "old-notes");
    mkdirSync(dir);
    vi.stubEnv("DATA_DIR", dir);
    const { createClient } = await import("@libsql/client");
    const old = createClient({ url: `file:${path.join(dir, "bunpo.db")}` });
    await old.execute("CREATE TABLE notes (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, text TEXT NOT NULL, sentence TEXT NOT NULL, memo TEXT NOT NULL DEFAULT '', test_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE (user_id, text))");
    await old.execute("INSERT INTO notes (user_id, text, sentence, test_id, created_at) VALUES (1, '相場', '', 't', 'now')");
    old.close();

    const client = await (await loadDb())();

    const { rows } = await client.execute("SELECT text, anchor FROM notes");
    expect(rows.map((row) => ({ ...row }))).toEqual([{ text: "相場", anchor: null }]);
  });

  it("adds the title column to a tests table from before it, filled from each payload", async () => {
    const dir = path.join(process.env.DATA_DIR!, "old-titles");
    mkdirSync(dir);
    vi.stubEnv("DATA_DIR", dir);
    const { createClient } = await import("@libsql/client");
    const old = createClient({ url: `file:${path.join(dir, "bunpo.db")}` });
    await old.execute("CREATE TABLE tests (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, position INTEGER, payload TEXT NOT NULL, submission TEXT, draft TEXT)");
    await old.execute(`INSERT INTO tests (id, created_at, payload) VALUES ('a', 'now', '{"title":"第1週"}'), ('b', 'now', 'not json')`);
    old.close();

    const client = await (await loadDb())();

    const { rows } = await client.execute("SELECT id, title FROM tests ORDER BY id");
    expect(rows.map((row) => ({ ...row }))).toEqual([{ id: "a", title: "第1週" }, { id: "b", title: "" }]);
  });

  it("turns each result saved before attempts were kept into the owner's first attempt of its test", async () => {
    const dir = path.join(process.env.DATA_DIR!, "before-attempts");
    mkdirSync(dir);
    vi.stubEnv("DATA_DIR", dir);
    const { createClient } = await import("@libsql/client");
    const old = createClient({ url: `file:${path.join(dir, "bunpo.db")}` });
    await old.execute(OLD_USERS);
    await old.execute("INSERT INTO users (name, password, created_at) VALUES ('Huy', 'x', 'now')");
    await old.execute("CREATE TABLE tests (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, position INTEGER, payload TEXT NOT NULL, submission TEXT)");
    await old.execute(`INSERT INTO tests (id, created_at, payload, submission) VALUES
      ('20261027-aaaaaa', 'now', '{}', '{"submittedAt":"2026-10-27T09:30:00.000Z","score":2,"total":3}'),
      ('20261027-bbbbbb', 'now', '{}', NULL),
      ('20261027-cccccc', 'now', '{}', 'not json')`);
    old.close();

    const client = await (await loadDb())();
    await (await loadDb())(); // Starting again adds no second copy.

    const { rows } = await client.execute("SELECT user_id, test_id, submitted_at, score, total FROM attempts");
    expect(rows.map((row) => ({ ...row }))).toEqual([
      { user_id: 1, test_id: "20261027-aaaaaa", submitted_at: "2026-10-27T09:30:00.000Z", score: 2, total: 3 },
    ]);
  });

  it("gives the progress from before it was each user's to the oldest account, once", async () => {
    const dir = path.join(process.env.DATA_DIR!, "before-users-progress");
    mkdirSync(dir);
    vi.stubEnv("DATA_DIR", dir);
    const { createClient } = await import("@libsql/client");
    const old = createClient({ url: `file:${path.join(dir, "bunpo.db")}` });
    await old.batch([
      OLD_USERS,
      "INSERT INTO users (name, password, created_at) VALUES ('Huy', 'x', 'now'), ('Mai', 'x', 'now')",
      "CREATE TABLE tests (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, position INTEGER, payload TEXT NOT NULL, submission TEXT, draft TEXT)",
      `INSERT INTO tests (id, created_at, payload, submission, draft) VALUES
        ('20261027-aaaaaa', 'now', '{}', '{"submittedAt":"2026-10-27T09:30:00.000Z","score":2,"total":3}', NULL),
        ('20261027-bbbbbb', 'now', '{}', NULL, '{"answers":{"q1":2},"checked":[]}'),
        ('20261027-cccccc', 'now', '{}', NULL, NULL)`,
      "CREATE TABLE reviewed (test_id TEXT NOT NULL REFERENCES tests (id), grammar_id TEXT NOT NULL, PRIMARY KEY (test_id, grammar_id))",
      "INSERT INTO reviewed VALUES ('20261027-aaaaaa', 'n2-w1-d1-g1')",
      "CREATE TABLE learned_words (word_id TEXT PRIMARY KEY, learned_at TEXT NOT NULL)",
      "INSERT INTO learned_words VALUES ('n2-c1-招待状', 'now')",
    ]);
    old.close();

    const client = await (await loadDb())();
    await (await loadDb())(); // Starting again moves nothing twice.

    const rowsOf = async (sql: string) => (await client.execute(sql)).rows.map((row) => ({ ...row }));
    expect(await rowsOf("SELECT user_id, test_id, submission IS NOT NULL AS taken, draft FROM progress ORDER BY test_id")).toEqual([
      { user_id: 1, test_id: "20261027-aaaaaa", taken: 1, draft: null },
      { user_id: 1, test_id: "20261027-bbbbbb", taken: 0, draft: '{"answers":{"q1":2},"checked":[]}' },
    ]);
    expect(await rowsOf("SELECT count(*) AS n FROM tests WHERE submission IS NOT NULL OR draft IS NOT NULL")).toEqual([{ n: 0 }]);
    expect(await rowsOf("SELECT user_id, test_id FROM attempts")).toEqual([{ user_id: 1, test_id: "20261027-aaaaaa" }]);
    expect(await rowsOf("SELECT user_id, grammar_id FROM reviewed")).toEqual([{ user_id: 1, grammar_id: "n2-w1-d1-g1" }]);
    expect(await rowsOf("SELECT user_id, word_id FROM learned_words")).toEqual([{ user_id: 1, word_id: "n2-c1-招待状" }]);
  });

  describe("connecting", () => {
    it("tries again on the next call after a failed connection", async () => {
      // mkdir fails when a part of DATA_DIR is a file.
      const blocker = path.join(process.env.DATA_DIR!, "a-file");
      writeFileSync(blocker, "");
      const db = await loadDb();
      vi.stubEnv("DATA_DIR", path.join(blocker, "data"));

      await expect(db()).rejects.toThrow();

      vi.unstubAllEnvs();
      await expect(db()).resolves.toBeDefined();
    });
  });
});
