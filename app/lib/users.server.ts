import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "./db.server";

/** Accounts: a name (shown on notes) and a password, stored as a salted scrypt hash. */

const hash = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await hash(password, salt, 32)).toString("hex")}`;
}

async function matches(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  return timingSafeEqual(await hash(password, Buffer.from(salt, "hex"), 32), Buffer.from(expected, "hex"));
}

/** Saves a new user and returns their id, or null when the name is taken. */
export async function createUser(name: string, password: string): Promise<number | null> {
  const { rows } = await (await db()).execute({
    sql: "INSERT INTO users (name, password, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING RETURNING id",
    args: [name, await hashPassword(password), new Date().toISOString()],
  });
  return rows[0] ? Number(rows[0].id) : null;
}

/** The user's id when the name and password match, or null. */
export async function verifyUser(name: string, password: string): Promise<number | null> {
  const { rows } = await (await db()).execute({ sql: "SELECT id, password FROM users WHERE name = ?", args: [name] });
  return rows[0] && (await matches(password, String(rows[0].password))) ? Number(rows[0].id) : null;
}

export async function getUser(id: number): Promise<{ id: number; name: string } | null> {
  const { rows } = await (await db()).execute({ sql: "SELECT id, name FROM users WHERE id = ?", args: [id] });
  return rows[0] ? { id: Number(rows[0].id), name: String(rows[0].name) } : null;
}

/** Renames a user. False when another user has the name. */
export async function renameUser(id: number, name: string): Promise<boolean> {
  // OR IGNORE skips the row instead of failing when the name is taken.
  const result = await (await db()).execute({ sql: "UPDATE OR IGNORE users SET name = ? WHERE id = ?", args: [name, id] });
  return result.rowsAffected > 0;
}

/** Sets a new password when the current one matches. */
export async function changePassword(id: number, current: string, next: string): Promise<boolean> {
  const { rows } = await (await db()).execute({ sql: "SELECT password FROM users WHERE id = ?", args: [id] });
  if (!rows[0] || !(await matches(current, String(rows[0].password)))) return false;
  await (await db()).execute({ sql: "UPDATE users SET password = ? WHERE id = ?", args: [await hashPassword(next), id] });
  return true;
}
