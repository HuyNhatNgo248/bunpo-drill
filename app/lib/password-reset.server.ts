import { createHash, randomBytes } from "node:crypto";
import { db } from "./db.server";
import { requiredEnv } from "./env.server";
import { sendMail } from "./mail.server";
import { hashPassword, type User } from "./users.server";

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
  const client = await db();
  const { rows } = await client.execute({
    sql: "SELECT 1 FROM password_resets WHERE user_id = ? AND created_at > ?",
    args: [userId, new Date(now - RESEND_WAIT_MS).toISOString()],
  });
  if (rows.length) return null;
  const token = randomBytes(32).toString("base64url");
  await client.batch(
    [
      // Expired tokens can do nothing, so they go whenever a new one is made.
      { sql: "DELETE FROM password_resets WHERE expires_at <= ?", args: [new Date(now).toISOString()] },
      {
        sql: "INSERT INTO password_resets (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        args: [hashToken(token), userId, new Date(now).toISOString(), new Date(now + LINK_LIFETIME_MS).toISOString()],
      },
    ],
    "write",
  );
  return token;
}

/** True while the token can still set a password. */
export async function isPasswordResetValid(token: string): Promise<boolean> {
  const { rows } = await (await db()).execute({
    sql: "SELECT 1 FROM password_resets WHERE token_hash = ? AND expires_at > ?",
    args: [hashToken(token), new Date().toISOString()],
  });
  return rows.length > 0;
}

/**
 * Uses the token up, sets the new password, and voids every other link of the user.
 * Returns the user's id, or null when the token is unknown, expired or already used.
 * shortcut: other devices stay signed in, because the login cookie holds only the user id; add a session version to users if a reset must sign them out.
 */
export async function resetPassword(token: string, password: string): Promise<number | null> {
  const client = await db();
  // Deleting first uses the token up in one step, so two tabs cannot both use one link.
  const { rows } = await client.execute({
    sql: "DELETE FROM password_resets WHERE token_hash = ? AND expires_at > ? RETURNING user_id",
    args: [hashToken(token), new Date().toISOString()],
  });
  if (!rows[0]) return null;
  const userId = Number(rows[0].user_id);
  await client.batch(
    [
      { sql: "UPDATE users SET password = ? WHERE id = ?", args: [await hashPassword(password), userId] },
      { sql: "DELETE FROM password_resets WHERE user_id = ?", args: [userId] },
    ],
    "write",
  );
  return userId;
}

/** Emails the link. It is built from APP_URL, never from the request's Host header, which a visitor can forge. */
export async function sendPasswordResetMail(user: User & { email: string }, token: string): Promise<void> {
  const link = new URL(`/reset-password?token=${token}`, requiredEnv("APP_URL")).toString();
  await sendMail({
    to: user.email,
    subject: "文法ドリル：パスワードの再設定",
    text: [
      `${user.name}さん`,
      "",
      "下のリンクを開いて、新しいパスワードを決めてください。リンクは1時間有効で、一度だけ使えます。",
      "",
      link,
      "",
      "心当たりがない場合は、このメールを無視してください。パスワードは変わりません。",
      "",
      "文法ドリル",
    ].join("\n"),
  });
}
