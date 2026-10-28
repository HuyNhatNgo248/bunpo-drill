import { createCookieSessionStorage } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { API_TOKEN, SESSION_SECRET } from "#tests/helpers/env";
import { ensureUser } from "#tests/helpers/session";
import { db } from "./db.server";
import {
  currentUserId,
  isSignedIn,
  requireSignIn,
  requireUserId,
  safeRedirect,
  signIn,
  signOut,
} from "./auth.server";

const BASE_URL = "https://bunpo.test";

const USER_ID = 7;

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

/** The name=value part of a Set-Cookie header, the way a browser sends it back. */
function cookieOf(response: Response) {
  return (response.headers.get("Set-Cookie") ?? "").split(";")[0];
}

/** A request to `path` with the given headers, and with no cookie unless the headers hold one. */
function requestTo(path: string, headers: Record<string, string> = {}) {
  return new Request(`${BASE_URL}${path}`, { headers });
}

/** A request with the login cookie of USER_ID, made the way the login page makes it. */
async function signedInRequest(path = "/") {
  return requestTo(path, { Cookie: cookieOf(await signIn(requestTo("/signin"), USER_ID, "/")) });
}

/** A login cookie that the app did not sign with its own data: another secret, or other session data. */
async function forgedCookie(secret: string, data: Record<string, unknown>) {
  const storage = createCookieSessionStorage({ cookie: { name: "bunpo_session", secrets: [secret] } });
  const session = await storage.getSession();
  for (const [key, value] of Object.entries(data)) session.set(key, value);
  return (await storage.commitSession(session)).split(";")[0];
}

/** Runs `run` and returns the Response it throws. Fails when it throws nothing or something else. */
async function thrownBy(run: () => Promise<unknown>): Promise<Response> {
  try {
    await run();
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    throw thrown;
  }
  throw new Error("expected a Response to be thrown");
}

describe("safeRedirect", () => {
  it("keeps a path on this site", () => {
    expect(safeRedirect("/tests/20261027-abc123?tab=2")).toBe("/tests/20261027-abc123?tab=2");
  });

  it("goes home for a value that is not text", () => {
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect(new File([], "x"))).toBe("/");
  });

  it("goes home for a target that leaves the site", () => {
    expect(safeRedirect("https://evil.test/")).toBe("/");
    expect(safeRedirect("//evil.test/")).toBe("/");
    expect(safeRedirect("/\\evil.test/")).toBe("/");
    expect(safeRedirect("tests")).toBe("/");
  });

  it("goes home instead of back to the login page", () => {
    expect(safeRedirect("/signin")).toBe("/");
    expect(safeRedirect("/signup?redirectTo=%2F")).toBe("/");
    expect(safeRedirect("/login?mode=signup")).toBe("/");
    // A page that only starts with the same letters is fine.
    expect(safeRedirect("/signing-tips")).toBe("/signing-tips");
  });
});

describe("signIn", () => {
  it("sends the user on to the page, with a login cookie that lasts 30 days", async () => {
    const response = await signIn(requestTo("/signin"), USER_ID, "/tests/20261027-abc123");
    const setCookie = response.headers.get("Set-Cookie");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/tests/20261027-abc123");
    expect(setCookie).toMatch(/^bunpo_session=/);
    expect(setCookie).toContain("Max-Age=2592000");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });
});

describe("currentUserId", () => {
  it("reads the user id from the login cookie", async () => {
    const request = await signedInRequest();

    expect(await currentUserId(request)).toBe(USER_ID);
    expect(await isSignedIn(request)).toBe(true);
  });

  it("returns null for a request with no cookie", async () => {
    expect(await currentUserId(requestTo("/"))).toBeNull();
    expect(await isSignedIn(requestTo("/"))).toBe(false);
  });

  it("returns null for a cookie signed with another secret", async () => {
    const cookie = await forgedCookie("another secret", { userId: USER_ID });

    expect(await currentUserId(requestTo("/", { Cookie: cookie }))).toBeNull();
  });

  it("returns null for an older cookie that holds no user id", async () => {
    // Cookies from before accounts are signed with the same secret but carry no userId.
    const cookie = await forgedCookie(SESSION_SECRET, { signedIn: true });

    expect(await currentUserId(requestTo("/", { Cookie: cookie }))).toBeNull();
  });

  it("returns null for a cookie of a user that no longer exists", async () => {
    const request = await signedInRequest();
    await (await db()).execute({ sql: "DELETE FROM users WHERE id = ?", args: [USER_ID] });

    expect(await currentUserId(request)).toBeNull();
  });

  it("returns null for a cookie of an older session version, as after a password reset", async () => {
    const request = await signedInRequest();
    await (await db()).execute({ sql: "UPDATE users SET session_version = 1 WHERE id = ?", args: [USER_ID] });

    expect(await currentUserId(request)).toBeNull();
    expect(await currentUserId(await signedInRequest())).toBe(USER_ID);
  });

  it("takes a cookie from before session versions as version 0, so no one is signed out by the update", async () => {
    const cookie = await forgedCookie(SESSION_SECRET, { userId: USER_ID });

    expect(await currentUserId(requestTo("/", { Cookie: cookie }))).toBe(USER_ID);
  });
});

describe("requireUserId", () => {
  it("returns the id of the signed-in user", async () => {
    expect(await requireUserId(await signedInRequest())).toBe(USER_ID);
  });

  it("throws a 401 JSON answer when no one is signed in", async () => {
    const response = await thrownBy(() => requireUserId(requestTo("/")));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Sign in to do this." });
  });
});

describe("requireSignIn", () => {
  const check = (request: Request) => requireSignIn(request, new URL(request.url));

  it("lets a signed-in user through", async () => {
    await expect(check(await signedInRequest("/tests/20261027-abc123"))).resolves.toBeUndefined();
  });

  it("lets anyone open the welcome page, the login page, and the pages that reset a forgotten password", async () => {
    await expect(check(requestTo("/welcome"))).resolves.toBeUndefined();
    await expect(check(requestTo("/signin"))).resolves.toBeUndefined();
    await expect(check(requestTo("/signup"))).resolves.toBeUndefined();
    await expect(check(requestTo("/login?mode=signup"))).resolves.toBeUndefined();
    await expect(check(requestTo("/forgot-password"))).resolves.toBeUndefined();
    await expect(check(requestTo("/reset-password?token=x"))).resolves.toBeUndefined();
  });

  describe("an /api request with no cookie", () => {
    it("passes with the API token as a Bearer token", async () => {
      await expect(check(requestTo("/api/tests", { Authorization: `Bearer ${API_TOKEN}` }))).resolves.toBeUndefined();
    });

    it("gets a 401 JSON answer without the token", async () => {
      const response = await thrownBy(() => check(requestTo("/api/tests")));

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Not signed in. Send BUNPO_API_TOKEN as a Bearer token." });
    });

    it("gets a 401 for a wrong token, or the token without the Bearer scheme", async () => {
      expect((await thrownBy(() => check(requestTo("/api/tests", { Authorization: "Bearer wrong" })))).status).toBe(401);
      expect((await thrownBy(() => check(requestTo("/api/tests", { Authorization: API_TOKEN })))).status).toBe(401);
    });
  });

  describe("a page request with no cookie", () => {
    it("goes to the login page, which returns to the same path and search", async () => {
      const response = await thrownBy(() => check(requestTo("/tests/20261027-abc123?tab=2")));

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/signin?redirectTo=%2Ftests%2F20261027-abc123%3Ftab%3D2");
    });

    it("goes to the welcome page from /, since the visitor may have no account yet", async () => {
      const response = await thrownBy(() => check(requestTo("/")));

      expect(response.headers.get("Location")).toBe("/welcome");
    });
  });
});

describe("signOut", () => {
  it("goes to the login page and clears the cookie, so the next request is signed out", async () => {
    const response = await signOut(await signedInRequest());

    expect(response.headers.get("Location")).toBe("/signin");
    expect(response.headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(await currentUserId(requestTo("/", { Cookie: cookieOf(response) }))).toBeNull();
  });
});
