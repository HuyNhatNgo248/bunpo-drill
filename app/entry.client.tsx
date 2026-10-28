import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { loadCatalog, localeFromCookie } from "~/lib/i18n";

async function main() {
  // The same cookie the server rendered with, so the hydration finds the same text.
  await loadCatalog(localeFromCookie(document.cookie));

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <I18nProvider i18n={i18n}>
          <HydratedRouter />
        </I18nProvider>
      </StrictMode>,
    );
  });
}

main().catch((error) => console.error("Failed to start the app:", error));
