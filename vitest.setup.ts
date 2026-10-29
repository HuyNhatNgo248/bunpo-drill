import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "motion";
import { afterAll, afterEach, beforeAll, expect } from "vitest";
import { API_TOKEN, APP_URL, MAIL_FROM, SESSION_SECRET } from "#tests/helpers/env";
import { loadCatalog } from "~/lib/i18n";
import { loadServerCatalogs } from "~/lib/i18n/catalogs.server";

// Registered from `./matchers` rather than the `./vitest` entrypoint: that entrypoint imports
// `expect` from vitest, but jest-dom declares no dependency on vitest, so pnpm cannot resolve it.
expect.extend(matchers);

// Animations end at once: happy-dom cancels the browser animations motion starts, which throws.
MotionGlobalConfig.skipAnimations = true;

// Unmount React trees after every test, so DOM assertions do not leak across tests.
// Saved answer sheets go too; the server tests run in Node, which has no localStorage.
afterEach(() => {
  cleanup();
  globalThis.localStorage?.clear();
});

/**
 * The settings of every test file.
 *
 * env.server.ts loads .env when a module imports it, but it keeps a setting that is already set.
 * So these values win over .env. An empty TURSO_DATABASE_URL makes db.server.ts open a SQLite file
 * in DATA_DIR, so no test reaches the Turso database that .env names.
 *
 * An empty RESEND_API_KEY makes mail.server.ts print emails to the log, so no test sends a real email.
 *
 * Each test file gets its own DATA_DIR. Test files that run at the same time do not share rows.
 */
const dataDir = mkdtempSync(path.join(tmpdir(), "bunpo-test-"));

process.env.TURSO_DATABASE_URL = "";
process.env.TURSO_AUTH_TOKEN = "";
process.env.DATA_DIR = dataDir;
process.env.SESSION_SECRET = SESSION_SECRET;
process.env.BUNPO_API_TOKEN = API_TOKEN;
process.env.RESEND_API_KEY = "";
process.env.MAIL_FROM = MAIL_FROM;
process.env.APP_URL = APP_URL;

afterAll(() => rmSync(dataDir, { recursive: true, force: true }));

// Every page is English unless a test loads another catalog: the components read the client
// singleton, and translate() in meta(), actions and emails reads the server instances.
beforeAll(async () => {
  await Promise.all([loadCatalog("en"), loadServerCatalogs()]);
});
