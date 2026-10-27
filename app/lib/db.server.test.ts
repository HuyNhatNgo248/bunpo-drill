import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/** The tables that the app reads and writes. */
const TABLES = ["reviewed", "tests", "users"];

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
