/**
 * The languages of the app. English is the source: its strings are the message ids, and a page is
 * English until someone picks Japanese with the switch in the header. The pick lives in a cookie,
 * which the server reads for the render and entry.client reads for the catalog it hydrates with.
 */
export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

/** Mirrors `sourceLocale` in lingui.config.ts. */
export const DEFAULT_LOCALE: Locale = "en";

/** Not HttpOnly: entry.client reads it, so the first paint and the hydration use the same catalog. */
export const LOCALE_COOKIE = "lang";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/**
 * The language a Cookie header or `document.cookie` picks, or English.
 *
 * @example
 * localeFromCookie("session=abc; lang=ja"); // -> "ja"
 * localeFromCookie("lang=fr");              // -> "en"
 */
export function localeFromCookie(cookie: string | null | undefined): Locale {
  const value = cookie
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === LOCALE_COOKIE)?.[1];
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** The language of a request, for an action or an email: the cookie's, or English. */
export function requestLocale(request: Request): Locale {
  return localeFromCookie(request.headers.get("Cookie"));
}

/** The Set-Cookie value that keeps `locale` for a year. */
export function localeCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * The language that the root loader read, for a route's `meta()`, which cannot read the request.
 *
 * @example
 * export const meta: Route.MetaFunction = ({ matches }) => [{ title: translate(localeFromMatches(matches), msg`Account`) }];
 */
export function localeFromMatches(matches: readonly ({ id: string; loaderData?: unknown } | undefined)[]): Locale {
  const data = matches.find((match) => match?.id === "root")?.loaderData as { locale?: unknown } | undefined;
  return isLocale(data?.locale) ? data.locale : DEFAULT_LOCALE;
}
