import { JLPT_LEVELS, type JlptLevel } from "./levels";
import type { TestKind } from "./views";

/**
 * The list page last opened in this browser, the grammar mock tests or the kanji, and its level. It lives in a cookie,
 * so the app opens there again, a sign-in after a sign-out included: signing out only drops the login cookie.
 * shortcut: per browser, like the language; keep it on the account if it should follow the user to another device.
 */
export type Tab = { subject: TestKind; level: JlptLevel };

export const TAB_COOKIE = "tab";

/**
 * The tab a Cookie header names, or null for none or one that can't be read.
 *
 * @example
 * tabFromCookie("lang=ja; tab=kanji:N2"); // -> { subject: "kanji", level: "N2" }
 */
export function tabFromCookie(cookie: string | null | undefined): Tab | null {
  const value = cookie
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === TAB_COOKIE)?.[1];
  const [subject, name] = value?.split(":") ?? [];
  const level = JLPT_LEVELS.find((candidate) => candidate === name);
  return (subject === "grammar" || subject === "kanji") && level ? { subject, level } : null;
}

/** Keeps `tab` in this browser for a year. */
export function rememberTab({ subject, level }: Tab) {
  document.cookie = `${TAB_COOKIE}=${subject}:${level}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
