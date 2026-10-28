import { setupI18n, type I18n } from "@lingui/core";
import { importMessages, provideServerI18n } from "./catalog";
import { LOCALES, type Locale } from "./locale";

/**
 * One read-only instance per language, filled once by `loadServerCatalogs`. Requests render at the
 * same time, so calling `activate()` on one shared instance could put one request's language in
 * another's HTML; each instance is activated once and never again.
 */
const instances = new Map<Locale, I18n>();

let loaded: Promise<void> | null = null;

/** Loads every catalog and connects `translate` to them. entry.server awaits it; only the first call loads. */
export function loadServerCatalogs(): Promise<void> {
  loaded ??= Promise.all(
    LOCALES.map(async (locale) => {
      instances.set(locale, setupI18n({ locale, messages: { [locale]: await importMessages(locale) } }));
    }),
  ).then(() => provideServerI18n(getServerI18n));
  return loaded;
}

/** The server instance of `locale`, after `loadServerCatalogs`. */
export function getServerI18n(locale: Locale): I18n {
  const instance = instances.get(locale);
  if (!instance) throw new Error(`No server catalog is loaded for ${locale}. Await \`loadServerCatalogs()\` first.`);
  return instance;
}
