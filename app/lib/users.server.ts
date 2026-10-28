import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "./db.server";
import { normalizeEmail } from "./users";

/** Accounts: a name, an email for password resets, and a password stored as a salted scrypt hash. */

export type User = { id: number; name: string; email: string | null };

const hash = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await hash(password, salt, 32)).toString("hex")}`;
}

async function matches(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  return timingSafeEqual(await hash(password, Buffer.from(salt, "hex"), 32), Buffer.from(expected, "hex"));
}

const toUser = (row: Record<string, unknown>): User => ({
  id: Number(row.id),
  name: String(row.name),
  email: row.email === null ? null : String(row.email),
});

/**
 * Saves a new user and returns their id, or null when the name (or the email) is taken.
 * The email must already be normalized (normalizeEmail).
 */
export async function createUser(name: string, password: string, email: string | null = null): Promise<number | null> {
  const { rows } = await (await db()).execute({
    sql: "INSERT INTO users (name, password, email, created_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING id",
    args: [name, await hashPassword(password), email, new Date().toISOString()],
  });
  return rows[0] ? Number(rows[0].id) : null;
}

/**
 * The user's id when the username or the email and the password match, or null.
 * An email match comes first; usernames cannot hold "@", so the two never point at different users.
 */
export async function verifyUser(login: string, password: string): Promise<number | null> {
  const email = normalizeEmail(login);
  const { rows } = await (await db()).execute({
    sql: "SELECT id, password FROM users WHERE email = ? OR name = ? ORDER BY email = ? DESC LIMIT 1",
    args: [email, login, email],
  });
  return rows[0] && (await matches(password, String(rows[0].password))) ? Number(rows[0].id) : null;
}

export async function getUser(id: number): Promise<User | null> {
  const { rows } = await (await db()).execute({ sql: "SELECT id, name, email FROM users WHERE id = ?", args: [id] });
  return rows[0] ? toUser(rows[0]) : null;
}

/** The version that the user's login cookies must hold, or null when there is no such user. */
export async function getSessionVersion(id: number): Promise<number | null> {
  const { rows } = await (await db()).execute({ sql: "SELECT session_version FROM users WHERE id = ?", args: [id] });
  return rows[0] ? Number(rows[0].session_version) : null;
}

/** The user with this normalized email, or null. */
export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await (await db()).execute({ sql: "SELECT id, name, email FROM users WHERE email = ?", args: [email] });
  return rows[0] ? toUser(rows[0]) : null;
}

/** Renames a user. False when another user has the name. */
export async function renameUser(id: number, name: string): Promise<boolean> {
  // OR IGNORE skips the row instead of failing when the name is taken.
  const result = await (await db()).execute({ sql: "UPDATE OR IGNORE users SET name = ? WHERE id = ?", args: [name, id] });
  return result.rowsAffected > 0;
}

/** Sets the user's normalized email. False when another user has it. */
export async function setEmail(id: number, email: string): Promise<boolean> {
  const result = await (await db()).execute({ sql: "UPDATE OR IGNORE users SET email = ? WHERE id = ?", args: [email, id] });
  return result.rowsAffected > 0;
}

/** Sets a new password when the current one matches. */
export async function changePassword(id: number, current: string, next: string): Promise<boolean> {
  const { rows } = await (await db()).execute({ sql: "SELECT password FROM users WHERE id = ?", args: [id] });
  if (!rows[0] || !(await matches(current, String(rows[0].password)))) return false;
  await (await db()).execute({ sql: "UPDATE users SET password = ? WHERE id = ?", args: [await hashPassword(next), id] });
  return true;
}
