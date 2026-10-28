import { defineConfig } from "@lingui/cli";
import { DEFAULT_LOCALE, LOCALES } from "./app/lib/i18n/locale";

export default defineConfig({
  sourceLocale: DEFAULT_LOCALE,
  // From locale.ts, so the list of languages exists once.
  locales: [...LOCALES],
  catalogs: [
    {
      path: "<rootDir>/app/locales/{locale}",
      include: ["app"],
      // A test is not a page, so its strings must not reach a catalog.
      exclude: ["**/node_modules/**", "**/build/**", "**/*.test.{ts,tsx}"],
    },
  ],
});
