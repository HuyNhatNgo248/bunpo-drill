import { i18n, type I18n, type MessageDescriptor, type Messages } from "@lingui/core";
import { DEFAULT_LOCALE, type Locale } from "./locale";

/**
 * Gives the server instance of a language. `loadServerCatalogs` in catalogs.server.ts sets it. This
 * module cannot import the `.server` module, because `translate` runs in `meta()`, which is client code too.
 */
let serverI18n: ((locale: Locale) => I18n) | null = null;

/** Connects `translate` to the server instances. Only `loadServerCatalogs` calls it. */
export function provideServerI18n(get: (locale: Locale) => I18n): void {
  serverI18n = get;
}

/**
 * Translates a descriptor synchronously, outside React: in `meta()`, in an action, in an email.
 *
 * On the server it reads the instance of `locale` that catalogs.server.ts loaded. On the client it
 * reads the `@lingui/core` singleton, which entry.client filled before hydrating, and ignores `locale`.
 * Pass a `msg` descriptor, never a `t` string: `t` translates when the module loads, not per request.
 *
 * @example
 * translate("ja", msg`Account`); // -> "アカウント"
 */
export function translate(locale: Locale, descriptor: MessageDescriptor): string {
  if (import.meta.env.SSR) {
    if (!serverI18n) throw new Error("No server catalog is loaded. Await `loadServerCatalogs()` first.");
    return serverI18n(locale)._(descriptor);
  }
  return i18n._(descriptor);
}

/** Activates the catalog of `locale` on the client singleton. The language switch reloads the page, so this runs once. */
export async function loadCatalog(locale: Locale): Promise<void> {
  i18n.loadAndActivate({ locale, messages: await importMessages(locale) });
}

/**
 * The compiled messages of `locale`. A missing catalog falls back to English instead of failing the
 * page: our message ids are the English strings, so an empty catalog still reads.
 */
export async function importMessages(locale: Locale): Promise<Messages> {
  try {
    return (await import(`../../locales/${locale}.po`)).messages;
  } catch (error) {
    console.error(`Failed to load the ${locale} catalog:`, error);
    return locale === DEFAULT_LOCALE ? {} : importMessages(DEFAULT_LOCALE);
  }
}
