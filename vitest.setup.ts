import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, expect } from "vitest";
import { API_TOKEN, SESSION_SECRET, SIGNUP_CODE } from "#tests/helpers/env";

// Registered from `./matchers` rather than the `./vitest` entrypoint: that entrypoint imports
// `expect` from vitest, but jest-dom declares no dependency on vitest, so pnpm cannot resolve it.
expect.extend(matchers);

// Unmount React trees after every test, so DOM assertions do not leak across tests.
afterEach(() => {
  cleanup();
});

/**
 * The settings of every test file.
 *
 * env.server.ts loads .env when a module imports it, but it keeps a setting that is already set.
 * So these values win over .env. An empty TURSO_DATABASE_URL makes db.server.ts open a SQLite file
 * in DATA_DIR, so no test reaches the Turso database that .env names.
 *
 * Each test file gets its own DATA_DIR. Test files that run at the same time do not share rows.
 */
const dataDir = mkdtempSync(path.join(tmpdir(), "bunpo-test-"));

process.env.TURSO_DATABASE_URL = "";
process.env.TURSO_AUTH_TOKEN = "";
process.env.DATA_DIR = dataDir;
process.env.SESSION_SECRET = SESSION_SECRET;
process.env.APP_PASSWORD = SIGNUP_CODE;
process.env.BUNPO_API_TOKEN = API_TOKEN;

afterAll(() => rmSync(dataDir, { recursive: true, force: true }));
