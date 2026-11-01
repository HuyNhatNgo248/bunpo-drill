import { useLingui } from "@lingui/react";
import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, type ShouldRevalidateFunction } from "react-router";

import type { Route } from "./+types/root";
import { ErrorPage } from "~/components/error-pages/ErrorPage";
import { requireSignIn } from "~/lib/auth.server";
import { describeError } from "~/lib/errors";
import { localeFromCookie, localeFromMatches, translate } from "~/lib/i18n";
import { loadServerCatalogs } from "~/lib/i18n/catalogs.server";
import interFont from "./fonts/inter-latin.woff2?url";
import "./tailwind.css";

// Every page and API call needs the login cookie (or, for /api, the quiz skill's token).
// The catalogs load first: data requests skip entry.server, and actions translate their messages.
export const middleware: Route.MiddlewareFunction[] = [
  () => loadServerCatalogs(),
  ({ request, url }) => requireSignIn(request, url),
];

// Inter is served from here (its @font-face is in tailwind.css). Noto Sans JP is too big to host, so it comes from Google.
export const links: Route.LinksFunction = () => [
  { rel: "preload", href: interFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
];

// Added after the page loads: a <link> in the HTML blocks the first paint, and its ~400 KB of font files slow the page's own downloads on mobile.
const JP_FONT_CSS = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400..700&display=swap";
const loadJpFont = `addEventListener("load",()=>document.head.append(Object.assign(document.createElement("link"),{rel:"stylesheet",href:"${JP_FONT_CSS}"})))`;

/** The language of the cookie, for the meta() of every route: meta() cannot read the request. */
export function loader({ request }: Route.LoaderArgs) {
  return { locale: localeFromCookie(request.headers.get("Cookie")) };
}

/** The language changes only by the language switch, which reloads the whole page, so the cookie is never read again. */
export const shouldRevalidate: ShouldRevalidateFunction = () => false;

export function Layout({ children }: { children: React.ReactNode }) {
  // entry.server and entry.client wrap the router in the catalog of the cookie's language.
  const { i18n } = useLingui();
  return (
    <html lang={i18n.locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: loadJpFont }} />
        <noscript>
          <link rel="stylesheet" href={JP_FONT_CSS} />
        </noscript>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function meta({ error, matches }: Route.MetaArgs) {
  // Pages set their own titles; this one names the error page.
  return error
    ? [
        {
          title: `${translate(localeFromMatches(matches), describeError(error).title)} · 文法ドリル`,
        },
      ]
    : [];
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const copy = describeError(error);
  // Failures go to the browser console instead of the page; 404s aren't worth logging.
  useEffect(() => {
    if (copy.status >= 500) console.error(error);
  }, [error, copy.status]);
  return <ErrorPage copy={copy} />;
}
