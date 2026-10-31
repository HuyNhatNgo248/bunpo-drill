import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/** The tables that the app reads and writes. */
const TABLES = ["attempts", "kanji_chapters", "learned_words", "password_resets", "reviewed", "tests", "users"];

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
    await old.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, password TEXT NOT NULL, created_at TEXT NOT NULL)");
    await old.execute("INSERT INTO users (name, password, created_at) VALUES ('Huy', 'x', 'now')");
    old.close();

    const client = await (await loadDb())();

    const { rows } = await client.execute("SELECT name, email FROM users");
    expect(rows.map((row) => ({ ...row }))).toEqual([{ name: "Huy", email: null }]);
    await client.execute("UPDATE users SET email = 'huy@example.com'");
    await client.execute("INSERT INTO users (name, password, created_at) VALUES ('Mai', 'x', 'now')");
    await expect(client.execute("UPDATE users SET email = 'huy@example.com' WHERE name = 'Mai'")).rejects.toThrow(/UNIQUE/);
  });

  it("turns each result saved before attempts were kept into the first attempt of its test", async () => {
    const dir = path.join(process.env.DATA_DIR!, "before-attempts");
    mkdirSync(dir);
    vi.stubEnv("DATA_DIR", dir);
    const { createClient } = await import("@libsql/client");
    const old = createClient({ url: `file:${path.join(dir, "bunpo.db")}` });
    await old.execute("CREATE TABLE tests (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, position INTEGER, payload TEXT NOT NULL, submission TEXT)");
    await old.execute(`INSERT INTO tests (id, created_at, payload, submission) VALUES
      ('20261027-aaaaaa', 'now', '{}', '{"submittedAt":"2026-10-27T09:30:00.000Z","score":2,"total":3}'),
      ('20261027-bbbbbb', 'now', '{}', NULL),
      ('20261027-cccccc', 'now', '{}', 'not json')`);
    old.close();

    const client = await (await loadDb())();
    await (await loadDb())(); // Starting again adds no second copy.

    const { rows } = await client.execute("SELECT test_id, submitted_at, score, total FROM attempts");
    expect(rows.map((row) => ({ ...row }))).toEqual([
      { test_id: "20261027-aaaaaa", submitted_at: "2026-10-27T09:30:00.000Z", score: 2, total: 3 },
    ]);
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
