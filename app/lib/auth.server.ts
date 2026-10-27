import { createHash, timingSafeEqual } from "node:crypto";
import { createCookieSessionStorage, redirect, type SessionStorage } from "react-router";
import { requiredEnv } from "./env.server";

/**
 * One person, one password (APP_PASSWORD). Signing in sets a signed cookie for
 * 30 days. The quiz skill has no cookie, so /api also takes BUNPO_API_TOKEN as
 * a Bearer token. Changing SESSION_SECRET signs everyone out.
 */

let storage: SessionStorage<{ signedIn: true }> | undefined;

// Created on first use, so a missing SESSION_SECRET fails the request instead of the server start.
function sessions() {
  storage ??= createCookieSessionStorage({
    cookie: {
      // Its own name: cookies are shared by every app on localhost, whatever the port.
      name: "bunpo_session",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secrets: [requiredEnv("SESSION_SECRET")],
    },
  });
  return storage;
}

/**
 * Runs before every request (root middleware): no cookie means the login page, or a 401 for /api.
 * `url` is React Router's normalized URL: in-app navigations and form posts request "/login.data"
 * and the like, which it reports as "/login".
 */
export async function requireSignIn(request: Request, url: URL) {
  if (url.pathname === "/login" || (await isSignedIn(request))) return;
  if (url.pathname.startsWith("/api/")) {
    if (hasApiToken(request)) return;
    throw Response.json({ error: "Not signed in. Send BUNPO_API_TOKEN as a Bearer token." }, { status: 401 });
  }
  throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
}

export async function isSignedIn(request: Request) {
  const session = await sessions().getSession(request.headers.get("Cookie"));
  return session.get("signedIn") === true;
}

export function checkPassword(password: string) {
  return same(password, requiredEnv("APP_PASSWORD"));
}

export async function signIn(request: Request, redirectTo: string) {
  const session = await sessions().getSession(request.headers.get("Cookie"));
  session.set("signedIn", true);
  return redirect(redirectTo, { headers: { "Set-Cookie": await sessions().commitSession(session) } });
}

export async function signOut(request: Request) {
  const session = await sessions().getSession(request.headers.get("Cookie"));
  return redirect("/login", { headers: { "Set-Cookie": await sessions().destroySession(session) } });
}

/** Where to go after signing in: only a path on this site, never back to the login page. */
export function safeRedirect(to: FormDataEntryValue | string | null) {
  if (typeof to !== "string" || !to.startsWith("/") || to.startsWith("//") || to.startsWith("/\\")) return "/";
  return to.startsWith("/login") ? "/" : to;
}

function hasApiToken(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") && same(header.slice("Bearer ".length), requiredEnv("BUNPO_API_TOKEN"));
}

/** Compares secrets in constant time, so response timing doesn't hint at how much matched. */
function same(given: string, expected: string) {
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(given), hash(expected));
}
