import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_URL } from "#tests/helpers/env";
import { resetDatabase } from "#tests/helpers/db";
import { signedInRequest } from "#tests/helpers/session";
import { currentUserId } from "./auth.server";
import { db } from "./db.server";
import {
  createPasswordReset,
  isPasswordResetValid,
  LINK_LIFETIME_MS,
  resetPassword,
  sendPasswordResetMail,
} from "./password-reset.server";
import { createUser, verifyUser } from "./users.server";

const NOW = new Date("2026-10-27T09:00:00.000Z");

const PASSWORD = "correct horse battery";

/** Moves the clock `ms` forward from NOW. */
const later = (ms: number) => vi.setSystemTime(NOW.getTime() + ms);

let userId: number;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  await resetDatabase();
  userId = (await createUser("Huy", PASSWORD, "huy@example.com"))!;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createPasswordReset", () => {
  it("makes a token that resets the password while it is valid", async () => {
    const token = await createPasswordReset(userId);

    expect(token).toMatch(/^[\w-]{43}$/);
    expect(await isPasswordResetValid(token!)).toBe(true);
  });

  it("stores only a hash of the token, so a copy of the database cannot use it", async () => {
    const token = await createPasswordReset(userId);

    const { rows } = await (await db()).execute("SELECT token_hash FROM password_resets");
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);
    expect(String(rows[0].token_hash)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("makes no second token within a minute, so the form cannot flood an inbox", async () => {
    await createPasswordReset(userId);

    later(59_000);
    expect(await createPasswordReset(userId)).toBeNull();

    later(61_000);
    expect(await createPasswordReset(userId)).not.toBeNull();
  });
});

describe("isPasswordResetValid", () => {
  it("ends an hour after the token was made", async () => {
    const token = (await createPasswordReset(userId))!;

    later(LINK_LIFETIME_MS - 1000);
    expect(await isPasswordResetValid(token)).toBe(true);

    later(LINK_LIFETIME_MS);
    expect(await isPasswordResetValid(token)).toBe(false);
  });

  it("is false for a token that was never made", async () => {
    expect(await isPasswordResetValid("made-up-token")).toBe(false);
  });
});

describe("resetPassword", () => {
  it("sets the new password and returns the user", async () => {
    const token = (await createPasswordReset(userId))!;

    expect(await resetPassword(token, "a new passphrase")).toBe(userId);
    expect(await verifyUser("Huy", "a new passphrase")).toBe(userId);
    expect(await verifyUser("Huy", PASSWORD)).toBeNull();
  });

  it("signs out every device that was signed in before the reset", async () => {
    const before = await signedInRequest(userId, "https://bunpo.test/");
    const token = (await createPasswordReset(userId))!;

    await resetPassword(token, "a new passphrase");

    expect(await currentUserId(before)).toBeNull();
    expect(await currentUserId(await signedInRequest(userId, "https://bunpo.test/"))).toBe(userId);
  });

  it("works once, so a link that leaks later is of no use", async () => {
    const token = (await createPasswordReset(userId))!;
    await resetPassword(token, "a new passphrase");

    expect(await resetPassword(token, "another passphrase")).toBeNull();
    expect(await verifyUser("Huy", "a new passphrase")).toBe(userId);
  });

  it("voids the other links of the user", async () => {
    const first = (await createPasswordReset(userId))!;
    later(61_000);
    const second = (await createPasswordReset(userId))!;

    await resetPassword(second, "a new passphrase");

    expect(await isPasswordResetValid(first)).toBe(false);
  });

  describe("a token that cannot be used", () => {
    it("returns null for an expired token, and keeps the password", async () => {
      const token = (await createPasswordReset(userId))!;
      later(LINK_LIFETIME_MS);

      expect(await resetPassword(token, "a new passphrase")).toBeNull();
      expect(await verifyUser("Huy", PASSWORD)).toBe(userId);
    });

    it("returns null for a token that was never made", async () => {
      expect(await resetPassword("made-up-token", "a new passphrase")).toBeNull();
    });
  });
});

describe("sendPasswordResetMail", () => {
  it("emails the user a link from APP_URL with the token", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendPasswordResetMail({ id: userId, name: "Huy", email: "huy@example.com" }, "the-token", "en");

    const printed = String(info.mock.calls[0]?.[0]);
    expect(printed).toContain("To: huy@example.com");
    expect(printed).toContain("Hi Huy,");
    expect(printed).toContain(`${APP_URL}/reset-password?token=the-token`);
  });

  it("writes the email in the language the user picked", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendPasswordResetMail({ id: userId, name: "Huy", email: "huy@example.com" }, "the-token", "ja");

    const printed = String(info.mock.calls[0]?.[0]);
    expect(printed).toContain("文法ドリル：パスワードの再設定");
    expect(printed).toContain("Huyさん");
  });
});
