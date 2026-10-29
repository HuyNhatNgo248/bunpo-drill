import { createHash, timingSafeEqual } from "node:crypto";
import { createCookieSessionStorage, redirect, type SessionStorage } from "react-router";
import { requiredEnv } from "./env.server";
import { getSessionVersion } from "./users.server";

/**
 * Anyone can sign up, then sign in with a name and
 * password (users.server.ts). Signing in sets a signed cookie holding the user's id and
 * session version for 30 days. The quiz skill has no cookie, so /api also takes BUNPO_API_TOKEN as a Bearer
 * token. Changing SESSION_SECRET signs everyone out.
 */

let storage: SessionStorage<{ userId: number; version: number }> | undefined;

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

/** The pages a signed-out visitor can open: the welcome page, signing in or up, and getting back in after a forgotten password. */
// /login only redirects old links to /signin or /signup. /locale switches the language, which a signed-out visitor needs too.
const PUBLIC_PAGES = new Set(["/welcome", "/signin", "/signup", "/login", "/forgot-password", "/reset-password", "/locale"]);

/**
 * Runs before every request (root middleware): no cookie means the sign-in page, or a 401 for /api.
 * A signed-out visit to / goes to the welcome page instead, since that visitor may have no account yet.
 * `url` is React Router's normalized URL: in-app navigations and form posts request "/signin.data"
 * and the like, which it reports as "/signin".
 */
export async function requireSignIn(request: Request, url: URL) {
  if (PUBLIC_PAGES.has(url.pathname) || (await isSignedIn(request))) return;
  if (url.pathname.startsWith("/api/")) {
    if (hasApiToken(request)) return;
    throw Response.json({ error: "Not signed in. Send BUNPO_API_TOKEN as a Bearer token." }, { status: 401 });
  }
  if (url.pathname === "/") throw redirect("/welcome");
  throw redirect(`/signin?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
}

export async function isSignedIn(request: Request) {
  return (await currentUserId(request)) !== null;
}

/**
 * The signed-in user's id, or null. Older cookies from before accounts have none.
 * The user must still exist and the cookie must hold their current session version, so a
 * password reset signs out every other device. Cookies from before versions count as version 0.
 */
export async function currentUserId(request: Request): Promise<number | null> {
  const session = await sessions().getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (userId === undefined) return null;
  return (await getSessionVersion(userId)) === (session.get("version") ?? 0) ? userId : null;
}

/** The signed-in user's id; pages behind the root middleware always have one, /api calls may not. */
export async function requireUserId(request: Request): Promise<number> {
  const id = await currentUserId(request);
  if (id === null) throw Response.json({ error: "Sign in to do this." }, { status: 401 });
  return id;
}

export async function signIn(request: Request, userId: number, redirectTo: string) {
  const session = await sessions().getSession(request.headers.get("Cookie"));
  session.set("userId", userId);
  session.set("version", (await getSessionVersion(userId)) ?? 0);
  return redirect(redirectTo, { headers: { "Set-Cookie": await sessions().commitSession(session) } });
}

export async function signOut(request: Request) {
  const session = await sessions().getSession(request.headers.get("Cookie"));
  return redirect("/signin", { headers: { "Set-Cookie": await sessions().destroySession(session) } });
}

/** The pages that sign in or up, which are no place to go back to once signed in. */
const SIGN_IN_PAGES = ["/signin", "/signup", "/login"];

const SITE = "http://site.invalid";

/**
 * `to` when it is a path on this site, else "/". It is read the way a browser reads a Location,
 * which drops tabs and newlines and takes a backslash for /, so "/\t/evil.example" can't leave the site.
 */
export function sitePath(to: FormDataEntryValue | string | null) {
  const url = typeof to === "string" && to.startsWith("/") ? URL.parse(to, SITE) : null;
  return url?.origin === SITE ? `${url.pathname}${url.search}${url.hash}` : "/";
}

/** Where to go after signing in: only a path on this site, never back to a sign-in page. */
export function safeRedirect(to: FormDataEntryValue | string | null) {
  const path = sitePath(to);
  return SIGN_IN_PAGES.some((page) => path === page || path.startsWith(`${page}?`) || path.startsWith(`${page}/`)) ? "/" : path;
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
