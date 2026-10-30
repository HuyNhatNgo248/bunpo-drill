import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { db } from "./db.server";
import {
  changePassword,
  createUser,
  findUserByEmail,
  forgetSessionVersions,
  getSessionVersion,
  getUser,
  renameUser,
  setEmail,
  verifyUser,
} from "./users.server";

const PASSWORD = "correct horse battery";

/** Sets a user's session version straight in the database, the way another process would. */
async function bumpVersion(id: number) {
  await (await db()).execute({ sql: "UPDATE users SET session_version = session_version + 1 WHERE id = ?", args: [id] });
}

/** The password column of a user, as the database holds it. */
async function storedPassword(id: number) {
  const { rows } = await (await db()).execute({ sql: "SELECT password FROM users WHERE id = ?", args: [id] });
  return String(rows[0].password);
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

  it("refuses when the current password is wrong, and keeps the old one", async () => {
    const id = await createUser("Huy", PASSWORD);

    expect(await changePassword(id!, "wrong password", "a new passphrase")).toBe(false);
    expect(await verifyUser("Huy", PASSWORD)).toBe(id);
  });

  it("returns false for an id that has no account", async () => {
    expect(await changePassword(999, PASSWORD, "a new passphrase")).toBe(false);
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

    expect(await getSessionVersion(id!)).toBe(0);
    expect(await getSessionVersion(id! + 1)).toBeNull();
  });

  it("keeps a version it read for a minute, then reads it again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const id = await createUser("Huy", PASSWORD);
    await getSessionVersion(id!);
    await bumpVersion(id!);

    expect(await getSessionVersion(id!)).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(await getSessionVersion(id!)).toBe(1);
  });

  it("reads the version again once the cache is forgotten", async () => {
    const id = await createUser("Huy", PASSWORD);
    await getSessionVersion(id!);
    await bumpVersion(id!);
    forgetSessionVersions();

    expect(await getSessionVersion(id!)).toBe(1);
  });
});
