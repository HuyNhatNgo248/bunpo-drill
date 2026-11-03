import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { db } from "./db.server";
import { createTest, getTest } from "./tests.server";
import {
  changePassword,
  createUser,
  deleteUser,
  findUserByEmail,
  forgetSessionVersions,
  getSessionVersion,
  getUser,
  lastTabOf,
  renameUser,
  saveLastTab,
  setEmail,
  verifyUser,
} from "./users.server";

const PASSWORD = "correct horse battery";

/** Sets a user's session version straight in the database, the way another process would. */
async function bumpVersion(id: number) {
  await (await db()).execute({ sql: "UPDATE users SET session_version = session_version + 1 WHERE id = ?", args: [id] });
}

/** The session version of a user, as the database holds it. */
async function storedVersion(id: number) {
  const { rows } = await (await db()).execute({ sql: "SELECT session_version FROM users WHERE id = ?", args: [id] });
  return Number(rows[0].session_version);
}

/** The password column of a user, as the database holds it. */
async function storedPassword(id: number) {
  const { rows } = await (await db()).execute({ sql: "SELECT password FROM users WHERE id = ?", args: [id] });
  return String(rows[0].password);
}

/** The tables that hold a user id, each with a row for user `id` on test `testId`, as the app's other modules would write them. */
const USER_TABLES = {
  progress: "INSERT INTO progress (user_id, test_id, submission, draft) VALUES (?, ?, NULL, '{}')",
  reviewed: "INSERT INTO reviewed (user_id, test_id, grammar_id) VALUES (?, ?, 'n3-w1-d1-g1')",
  attempts: "INSERT INTO attempts (user_id, test_id, submitted_at, score, total) VALUES (?, ?, '2026-10-27T00:00:00.000Z', 1, 3)",
  learned_words: "INSERT INTO learned_words (user_id, word_id, learned_at) VALUES (?, 'n2-c1-渡航', '2026-10-27T00:00:00.000Z')",
  notes: "INSERT INTO notes (user_id, test_id, text, sentence, created_at) VALUES (?, ?, '末', '', '')",
  password_resets: "INSERT INTO password_resets (token_hash, user_id, created_at, expires_at) VALUES ('hash-' || ?, ?, '', '')",
};

async function giveRows(id: number, testId: string) {
  for (const sql of Object.values(USER_TABLES)) {
    await (await db()).execute({ sql, args: sql.includes("hash-") ? [id, id] : sql.includes("test_id") ? [id, testId] : [id] });
  }
}

/** How many rows of each user table hold `id`. */
async function rowCounts(id: number) {
  const counts: Record<string, number> = {};
  for (const table of Object.keys(USER_TABLES)) {
    const { rows } = await (await db()).execute({ sql: `SELECT count(*) AS n FROM ${table} WHERE user_id = ?`, args: [id] });
    counts[table] = Number(rows[0].n);
  }
  return counts;
}

beforeEach(resetDatabase);

describe("createUser", () => {
  it("saves a user and returns the new id", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(id).toEqual(expect.any(Number));
    expect(await getUser(id!)).toEqual({ id, name: "Huy", email: null });
  });

  it("stores a salted hash, not the password", async () => {
    const first = await createUser("Huy", PASSWORD);
    const second = await createUser("Mai", PASSWORD);

    expect(await storedPassword(first!)).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(await storedPassword(first!)).not.toContain(PASSWORD);
    // A new salt for each user, so the same password gives a different hash.
    expect(await storedPassword(first!)).not.toBe(await storedPassword(second!));
  });

  it("saves the email that resets go to", async () => {
    const id = await createUser("Huy", PASSWORD, "huy@example.com");

    expect(await getUser(id!)).toEqual({ id, name: "Huy", email: "huy@example.com" });
  });

  it("returns null for an email that another user has", async () => {
    await createUser("Huy", PASSWORD, "huy@example.com");

    expect(await createUser("Mai", PASSWORD, "huy@example.com")).toBeNull();
  });

  it("gives a new user a new session version, even on a deleted user's id, so the old cookies don't fit", async () => {
    const first = await createUser("Huy", PASSWORD);
    const oldVersion = await storedVersion(first!);
    await deleteUser(first!, PASSWORD);

    const second = await createUser("Mai", PASSWORD);

    expect(second).toBe(first);
    expect(await storedVersion(second!)).not.toBe(oldVersion);
  });

  it("returns null for a name that is taken, whatever its case", async () => {
    await createUser("Huy", PASSWORD);

    expect(await createUser("Huy", PASSWORD)).toBeNull();
    expect(await createUser("huy", PASSWORD)).toBeNull();
  });
});

describe("verifyUser", () => {
  it("returns the id when the name and the password match", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(await verifyUser("Huy", PASSWORD)).toBe(id);
  });

  it("matches the email instead of the name, whatever its case and spaces", async () => {
    const id = await createUser("Huy", PASSWORD, "huy@example.com");

    expect(await verifyUser(" HUY@example.com", PASSWORD)).toBe(id);
    expect(await verifyUser("huy@example.com", "wrong")).toBeNull();
  });

  it("matches the name whatever its case", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(await verifyUser("HUY", PASSWORD)).toBe(id);
  });

  it("returns null for a wrong password", async () => {
    await createUser("Huy", PASSWORD);

    expect(await verifyUser("Huy", "wrong password")).toBeNull();
  });

  it("returns null for a name that has no account", async () => {
    expect(await verifyUser("Nobody", PASSWORD)).toBeNull();
  });
});

describe("getUser", () => {
  it("returns null for an id that has no account", async () => {
    expect(await getUser(999)).toBeNull();
  });
});

describe("lastTabOf and saveLastTab", () => {
  it("keeps the list page each user last opened, and gives null before one is", async () => {
    const id = (await createUser("huy", PASSWORD))!;
    const other = (await createUser("ana", PASSWORD))!;
    expect(await lastTabOf(id)).toBeNull();

    await saveLastTab(id, { subject: "grammar", level: "N3" });
    await saveLastTab(id, { subject: "kanji", level: "N2" });

    expect(await lastTabOf(id)).toEqual({ subject: "kanji", level: "N2" });
    expect(await lastTabOf(other)).toBeNull();
  });

  it("reads a saved value that names no tab as none", async () => {
    const id = (await createUser("huy", PASSWORD))!;
    await (await db()).execute({ sql: "UPDATE users SET last_tab = 'reading:N9' WHERE id = ?", args: [id] });

    expect(await lastTabOf(id)).toBeNull();
  });
});

describe("renameUser", () => {
  it("changes the name", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(await renameUser(id!, "Huy N.")).toBe(true);
    expect(await getUser(id!)).toEqual({ id, name: "Huy N.", email: null });
  });

  it("refuses a name that another user has, and keeps the old name", async () => {
    const id = await createUser("Huy", PASSWORD);
    await createUser("Mai", PASSWORD);

    expect(await renameUser(id!, "mai")).toBe(false);
    expect(await getUser(id!)).toEqual({ id, name: "Huy", email: null });
  });

  it("returns false for an id that has no account", async () => {
    expect(await renameUser(999, "Huy")).toBe(false);
  });
});

describe("changePassword", () => {
  it("sets the new password when the current one matches", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(await changePassword(id!, PASSWORD, "a new passphrase")).toBe(true);
    expect(await verifyUser("Huy", "a new passphrase")).toBe(id);
    expect(await verifyUser("Huy", PASSWORD)).toBeNull();
  });

  it("bumps the session version, so every device is signed out", async () => {
    const id = await createUser("Huy", PASSWORD);
    const before = (await getSessionVersion(id!))!;

    await changePassword(id!, PASSWORD, "a new passphrase");

    expect(await getSessionVersion(id!)).toBe(before + 1);
  });

  it("refuses when the current password is wrong, and keeps the old one", async () => {
    const id = await createUser("Huy", PASSWORD);
    const before = await storedVersion(id!);

    expect(await changePassword(id!, "wrong password", "a new passphrase")).toBe(false);
    expect(await verifyUser("Huy", PASSWORD)).toBe(id);
    expect(await storedVersion(id!)).toBe(before);
  });

  it("returns false for an id that has no account", async () => {
    expect(await changePassword(999, PASSWORD, "a new passphrase")).toBe(false);
  });
});

describe("deleteUser", () => {
  it("deletes the user and every row of theirs, and leaves other users alone", async () => {
    const id = (await createUser("Huy", PASSWORD))!;
    const other = (await createUser("Mai", PASSWORD))!;
    const test = await createTest(buildPayload());
    await giveRows(id, test.id);
    await giveRows(other, test.id);

    expect(await deleteUser(id, PASSWORD)).toBe(true);

    expect(await getUser(id)).toBeNull();
    expect(await getSessionVersion(id)).toBeNull();
    expect(Object.values(await rowCounts(id))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(Object.values(await rowCounts(other))).toEqual([1, 1, 1, 1, 1, 1]);
    expect(await getTest(test.id, other)).not.toBeNull();
  });

  it("deletes nothing for a wrong password", async () => {
    const id = (await createUser("Huy", PASSWORD))!;
    await giveRows(id, (await createTest(buildPayload())).id);

    expect(await deleteUser(id, "wrong password")).toBe(false);

    expect(await getUser(id)).not.toBeNull();
    expect(Object.values(await rowCounts(id))).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("returns false for an id that has no account", async () => {
    expect(await deleteUser(999, PASSWORD)).toBe(false);
  });
});

describe("findUserByEmail", () => {
  it("finds the user with the email", async () => {
    const id = await createUser("Huy", PASSWORD, "huy@example.com");

    expect(await findUserByEmail("huy@example.com")).toEqual({ id, name: "Huy", email: "huy@example.com" });
  });

  it("returns null for an email that no user has", async () => {
    await createUser("Huy", PASSWORD);

    expect(await findUserByEmail("huy@example.com")).toBeNull();
  });
});

describe("setEmail", () => {
  it("adds an email to an account that has none, and changes it later", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(await setEmail(id!, "huy@example.com")).toBe(true);
    expect(await setEmail(id!, "huy@example.jp")).toBe(true);
    expect((await getUser(id!))?.email).toBe("huy@example.jp");
  });

  it("keeps the email when the user saves it again unchanged", async () => {
    const id = await createUser("Huy", PASSWORD, "huy@example.com");

    expect(await setEmail(id!, "huy@example.com")).toBe(true);
  });

  it("refuses an email that another user has, and keeps the old one", async () => {
    const id = await createUser("Huy", PASSWORD, "huy@example.com");
    await createUser("Mai", PASSWORD, "mai@example.com");

    expect(await setEmail(id!, "mai@example.com")).toBe(false);
    expect((await getUser(id!))?.email).toBe("huy@example.com");
  });
});

describe("getSessionVersion", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the version of a user, and null for an id that has no account", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(await getSessionVersion(id!)).toBe(await storedVersion(id!));
    expect(await getSessionVersion(id! + 1)).toBeNull();
  });

  it("keeps a version it read for a minute, then reads it again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const id = await createUser("Huy", PASSWORD);
    const first = (await getSessionVersion(id!))!;
    await bumpVersion(id!);

    expect(await getSessionVersion(id!)).toBe(first);
    vi.advanceTimersByTime(60_000);
    expect(await getSessionVersion(id!)).toBe(first + 1);
  });

  it("reads the version again once the cache is forgotten", async () => {
    const id = await createUser("Huy", PASSWORD);
    const first = (await getSessionVersion(id!))!;
    await bumpVersion(id!);
    forgetSessionVersions();

    expect(await getSessionVersion(id!)).toBe(first + 1);
  });
});
