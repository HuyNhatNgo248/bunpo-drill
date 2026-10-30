import { msg } from "@lingui/core/macro";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lte, sql } from "drizzle-orm";
import { orm, write } from "./db.server";
import { requiredEnv } from "./env.server";
import { sendMail } from "./mail.server";
import { passwordResets, users } from "./schema.server";
import { forgetSessionVersions, hashPassword, type User } from "./users.server";
import { translate, type Locale } from "~/lib/i18n";

/**
 * Forgot password: the user asks for a link by email, and the link sets a new password.
 * A link works once and for an hour. Only the sha256 of its token is stored, so a copy of the
 * database cannot reset anyone's password.
 */

export const LINK_LIFETIME_MS = 60 * 60 * 1000;

/** A user who asks again within a minute gets no second email, so the form cannot flood an inbox. */
const RESEND_WAIT_MS = 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Makes a link token for the user, or null when the user got one less than a minute ago. */
export async function createPasswordReset(userId: number): Promise<string | null> {
  const now = Date.now();
  const db = await orm();
  const recent = await db
    .select({ userId: passwordResets.userId })
    .from(passwordResets)
    .where(and(eq(passwordResets.userId, userId), gt(passwordResets.createdAt, new Date(now - RESEND_WAIT_MS).toISOString())))
    .limit(1);
  if (recent.length) return null;
  const token = randomBytes(32).toString("base64url");
  const at = new Date(now).toISOString();
  await write([
    // Expired tokens can do nothing, so they go whenever a new one is made.
    db.delete(passwordResets).where(lte(passwordResets.expiresAt, at)),
    db.insert(passwordResets).values({
      tokenHash: hashToken(token),
      userId,
      createdAt: at,
      expiresAt: new Date(now + LINK_LIFETIME_MS).toISOString(),
    }),
  ]);
  return token;
}

/** True while the token can still set a password. */
export async function isPasswordResetValid(token: string): Promise<boolean> {
  const valid = await (await orm())
    .select({ userId: passwordResets.userId })
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, hashToken(token)), gt(passwordResets.expiresAt, new Date().toISOString())))
    .limit(1);
  return valid.length > 0;
}

/**
 * Uses the token up, sets the new password, voids every other link of the user, and signs out
 * every device by bumping the session version (the page that reset signs in again after).
 * Returns the user's id, or null when the token is unknown, expired or already used.
 */
export async function resetPassword(token: string, password: string): Promise<number | null> {
  const db = await orm();
  // Deleting first uses the token up in one step, so two tabs cannot both use one link.
  const [used] = await db
    .delete(passwordResets)
    .where(and(eq(passwordResets.tokenHash, hashToken(token)), gt(passwordResets.expiresAt, new Date().toISOString())))
    .returning({ userId: passwordResets.userId });
  if (!used) return null;
  const { userId } = used;
  await write([
    db
      .update(users)
      .set({ password: await hashPassword(password), sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, userId)),
    db.delete(passwordResets).where(eq(passwordResets.userId, userId)),
  ]);
  forgetSessionVersions();
  return userId;
}

/** Emails the link. It is built from APP_URL, never from the request's Host header, which a visitor can forge. */
export async function sendPasswordResetMail(user: User & { email: string }, token: string, locale: Locale): Promise<void> {
  const link = new URL(`/reset-password?token=${token}`, requiredEnv("APP_URL")).toString();
  const name = user.name;
  await sendMail({
    to: user.email,
    subject: translate(locale, msg`文法ドリル: reset your password`),
    text: [
      translate(locale, msg`Hi ${name},`),
      "",
      translate(locale, msg`Open the link below and choose a new password. The link works for one hour, and only once.`),
      "",
      link,
      "",
      translate(locale, msg`If you didn't ask for this, ignore this email. Your password won't change.`),
      "",
      "文法ドリル",
    ].join("\n"),
  });
}
