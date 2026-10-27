import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { db } from "./db.server";
import { changePassword, createUser, getUser, renameUser, verifyUser } from "./users.server";

const PASSWORD = "correct horse battery";

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
    expect(await getUser(id!)).toEqual({ id, name: "Huy" });
  });

  it("stores a salted hash, not the password", async () => {
    const first = await createUser("Huy", PASSWORD);
    const second = await createUser("Mai", PASSWORD);

    expect(await storedPassword(first!)).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(await storedPassword(first!)).not.toContain(PASSWORD);
    // A new salt for each user, so the same password gives a different hash.
    expect(await storedPassword(first!)).not.toBe(await storedPassword(second!));
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
    expect(await getUser(id!)).toEqual({ id, name: "Huy N." });
  });

  it("refuses a name that another user has, and keeps the old name", async () => {
    const id = await createUser("Huy", PASSWORD);
    await createUser("Mai", PASSWORD);

    expect(await renameUser(id!, "mai")).toBe(false);
    expect(await getUser(id!)).toEqual({ id, name: "Huy" });
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
