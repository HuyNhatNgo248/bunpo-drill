import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { desc, eq, or, sql } from "drizzle-orm";
import { orm } from "./db.server";
import { users } from "./schema.server";
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

/** The columns a User is made of. */
const USER = { id: users.id, name: users.name, email: users.email };

/** Whether a write failed on a UNIQUE column (a name or an email that another user has). */
function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? (error.cause as { extendedCode?: string } | undefined) : undefined;
  return cause?.extendedCode === "SQLITE_CONSTRAINT_UNIQUE";
}

/**
 * Saves a new user and returns their id, or null when the name (or the email) is taken.
 * The email must already be normalized (normalizeEmail).
 */
export async function createUser(name: string, password: string, email: string | null = null): Promise<number | null> {
  const [row] = await (await orm())
    .insert(users)
    .values({ name, password: await hashPassword(password), email, createdAt: new Date().toISOString() })
    .onConflictDoNothing()
    .returning({ id: users.id });
  return row?.id ?? null;
}

/**
 * The user's id when the username or the email and the password match, or null.
 * An email match comes first; usernames cannot hold "@", so the two never point at different users.
 */
export async function verifyUser(login: string, password: string): Promise<number | null> {
  const email = normalizeEmail(login);
  const [row] = await (await orm())
    .select({ id: users.id, password: users.password })
    .from(users)
    .where(or(eq(users.email, email), eq(users.name, login)))
    .orderBy(desc(sql`${users.email} = ${email}`))
    .limit(1);
  return row && (await matches(password, row.password)) ? row.id : null;
}

export async function getUser(id: number): Promise<User | null> {
  const [user] = await (await orm()).select(USER).from(users).where(eq(users.id, id));
  return user ?? null;
}

/**
 * Session versions read in the last minute, so a signed-in page needs no database round trip just to check
 * the cookie. A password reset in this process forgets them at once.
 * shortcut: per process, so a reset made by another one (a second instance, `pnpm dev` on the same Turso database)
 * reaches this one only after VERSION_TTL_MS; share or drop the cache when running more than one instance.
 */
const versions = new Map<number, { version: number; readAt: number }>();
const VERSION_TTL_MS = 60_000;

/** The version that the user's login cookies must hold, or null when there is no such user. */
export async function getSessionVersion(id: number): Promise<number | null> {
  const cached = versions.get(id);
  if (cached && Date.now() - cached.readAt < VERSION_TTL_MS) return cached.version;
  const [row] = await (await orm()).select({ version: users.sessionVersion }).from(users).where(eq(users.id, id));
  if (!row) return null;
  const { version } = row;
  versions.set(id, { version, readAt: Date.now() });
  return version;
}

/** Forgets every cached session version; call it after changing one. */
export function forgetSessionVersions() {
  versions.clear();
}

/** The user with this normalized email, or null. */
export async function findUserByEmail(email: string): Promise<User | null> {
  const [user] = await (await orm()).select(USER).from(users).where(eq(users.email, email));
  return user ?? null;
}

/** Renames a user. False when another user has the name, or there is no such user. */
export function renameUser(id: number, name: string): Promise<boolean> {
  return updateUnique(id, { name });
}

/** Sets the user's normalized email. False when another user has it, or there is no such user. */
export function setEmail(id: number, email: string): Promise<boolean> {
  return updateUnique(id, { email });
}

/** Sets a UNIQUE column of a user: false, not an error, when another user has the value. */
async function updateUnique(id: number, set: { name: string } | { email: string }): Promise<boolean> {
  try {
    const result = await (await orm()).update(users).set(set).where(eq(users.id, id));
    return result.rowsAffected > 0;
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
}

/** Sets a new password when the current one matches. */
export async function changePassword(id: number, current: string, next: string): Promise<boolean> {
  const db = await orm();
  const [row] = await db.select({ password: users.password }).from(users).where(eq(users.id, id));
  if (!row || !(await matches(current, row.password))) return false;
  await db.update(users).set({ password: await hashPassword(next) }).where(eq(users.id, id));
  return true;
}
