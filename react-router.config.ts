import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Every route known from the first page: found lazily, the grammar page's index route is missing when the tabs prefetch it
  // (tabCache.ts), and the prefetch loads nothing. The app has few routes, so the list is small.
  routeDiscovery: { mode: "initial" },
} satisfies Config;
