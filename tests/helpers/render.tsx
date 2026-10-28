import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { createRoutesStub } from "react-router";

/** One route of the stub, as `createRoutesStub` declares it. */
export type StubRoute = Parameters<typeof createRoutesStub>[0][number];

/**
 * Renders `ui` as the page at `url`, under a router and the catalog that is active (English, from vitest.setup.ts).
 *
 * The components use links, forms and fetchers, and these need a router. `action` answers a form
 * that the page sends to itself, and `routes` adds the routes that its links and fetchers reach,
 * for example an action that records what a fetcher sends.
 *
 * @example
 * const { action, requests } = recordingAction();
 * renderRoute(<GrammarChips testId="20261027-abc123" chips={[buildReviewChip()]} />, {
 *   routes: [{ path: "/api/tests/:id", action }],
 * });
 */
export function renderRoute(
  ui: React.ReactNode,
  { url = "/", action, routes = [] }: { url?: string; action?: StubRoute["action"]; routes?: StubRoute[] } = {},
): RenderResult {
  const Stub = createRoutesStub([
    // The stub answers its loaders after the first paint. The page under test has none, so it draws nothing until then.
    { path: new URL(url, "https://bunpo.test").pathname, Component: () => ui, HydrateFallback: () => null, action },
    ...routes,
  ]);
  return render(
    <I18nProvider i18n={i18n}>
      <Stub initialEntries={[url]} />
    </I18nProvider>,
  );
}

/** Renders `ui` alone, with no router, under the catalog that is active: for components that only need their words. */
export function renderWithCatalog(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
  return render(ui, { ...options, wrapper: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider> });
}
