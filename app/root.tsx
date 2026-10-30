import { useLingui } from "@lingui/react";
import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import { ErrorPage } from "~/components/error-pages/ErrorPage";
import { requireSignIn } from "~/lib/auth.server";
import { describeError } from "~/lib/errors";
import { localeFromCookie, localeFromMatches, translate } from "~/lib/i18n";
import { loadServerCatalogs } from "~/lib/i18n/catalogs.server";
import "./tailwind.css";

// Every page and API call needs the login cookie (or, for /api, the quiz skill's token).
// The catalogs load first: data requests skip entry.server, and actions translate their messages.
export const middleware: Route.MiddlewareFunction[] = [
  () => loadServerCatalogs(),
  ({ request, url }) => requireSignIn(request, url),
];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Noto+Sans+JP:wght@400..700&display=swap",
  },
];

/** The language of the cookie, for the meta() of every route: meta() cannot read the request. */
export function loader({ request }: Route.LoaderArgs) {
  return { locale: localeFromCookie(request.headers.get("Cookie")) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  // entry.server and entry.client wrap the router in the catalog of the cookie's language.
  const { i18n } = useLingui();
  return (
    <html lang={i18n.locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
