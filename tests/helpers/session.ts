import { signIn } from "~/lib/auth.server";
import { db } from "~/lib/db.server";

/**
 * The name=value part of a response's Set-Cookie header, the way a browser sends it back.
 *
 * @example
 * new Request(url, { headers: { Cookie: cookieOf(response) } });
 */
export function cookieOf(response: Response): string {
  return (response.headers.get("Set-Cookie") ?? "").split(";")[0];
}

/**
 * Makes sure a user with this id exists, since a login cookie of a missing user signs no one in.
 * A user the test made itself is kept as it is.
 */
export async function ensureUser(userId: number): Promise<void> {
  await (await db()).execute({
    sql: "INSERT OR IGNORE INTO users (id, name, password, created_at) VALUES (?, ?, '', ?)",
    args: [userId, `user${userId}`, new Date().toISOString()],
  });
}

/**
 * A request to `url` with the login cookie of `userId`, made the way the login page makes it.
 * The user is made first when the test has not made them.
 *
 * @example
 * await loader(routeArgs(await signedInRequest(id, "https://bunpo.test/account")));
 */
export async function signedInRequest(userId: number, url: string, init: RequestInit = {}): Promise<Request> {
  await ensureUser(userId);
  const cookie = cookieOf(await signIn(new Request(url), userId, "/"));
  return new Request(url, { ...init, headers: { ...init.headers, Cookie: cookie } });
}
