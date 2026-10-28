/**
 * The arguments that React Router gives a route's loader or action, cut down to the request, the
 * URL and the params that the routes of this app read. Cast to the route's own argument type.
 *
 * @example
 * await action(routeArgs<Parameters<typeof action>[0]>(new Request(url, { method: "DELETE" }), { id }));
 */
export function routeArgs<Args>(request: Request, params: Record<string, string> = {}): Args {
  return { request, params, url: new URL(request.url), context: {} } as unknown as Args;
}

/**
 * The arguments of a route's `meta()`: its loader data, and the root match whose loader read the
 * language cookie. Cast to the route's own argument type.
 *
 * @example
 * meta(metaArgs<Parameters<typeof meta>[0]>({ locale: "ja" }));
 */
export function metaArgs<Args>({ loaderData, locale = "en" }: { loaderData?: unknown; locale?: "en" | "ja" } = {}): Args {
  return { loaderData, matches: [{ id: "root", loaderData: { locale } }] } as unknown as Args;
}
