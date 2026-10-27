import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import { ErrorPage } from "~/components/error-pages/ErrorPage";
import { requireSignIn } from "~/lib/auth.server";
import { describeError } from "~/lib/errors";
import "./tailwind.css";

// Every page and API call needs the login cookie (or, for /api, the quiz skill's token).
export const middleware: Route.MiddlewareFunction[] = [({ request, url }) => requireSignIn(request, url)];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
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

export function meta({ error }: Route.MetaArgs) {
  // Pages set their own titles; this one names the error page.
  return error ? [{ title: `${describeError(error).title} · 文法ドリル` }] : [];
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
