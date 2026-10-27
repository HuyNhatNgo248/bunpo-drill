import { signIn } from "~/lib/auth.server";

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
 * A request to `url` with the login cookie of `userId`, made the way the login page makes it.
 *
 * @example
 * await loader(routeArgs(await signedInRequest(id, "https://bunpo.test/account")));
 */
export async function signedInRequest(userId: number, url: string, init: RequestInit = {}): Promise<Request> {
  const cookie = cookieOf(await signIn(new Request(url), userId, "/"));
  return new Request(url, { ...init, headers: { ...init.headers, Cookie: cookie } });
}
