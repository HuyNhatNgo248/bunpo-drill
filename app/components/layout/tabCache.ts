import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import type { JlptLevel } from "~/lib/levels";

/** The pages the tabs switch between. */
export const PATHS = { grammar: "/", kanji: "/kanji", reading: "/reading", notes: "/notes" } as const;

/** A tab's address at `level`. The notes have no level. */
export const tabHref = (path: string, level: JlptLevel | null) => (level && path !== PATHS.notes ? `${path}?level=${level}` : path);

type Entry = { data: unknown; at: number };

/** Each tab page's data by its address, so a switch between tabs shows the last data at once. */
const cache = new Map<string, Entry>();
/** Loads still on their way, so a click during a prefetch waits for it instead of asking again. */
const pending = new Map<string, Promise<unknown>>();
/** Younger than this (a prefetch just done), the cached data shows as it is. Older, the server's follows it. */
const FRESH_MS = 10_000;
/** Marks a prefetch's address (usePrefetchTabs). */
const PREFETCH = "prefetch";

/** The cache's key for an address: without React Router's `index` and the prefetch mark. */
function keyOf(href: string): string {
  const url = new URL(href, window.location.origin);
  url.searchParams.delete("index");
  url.searchParams.delete(PREFETCH);
  url.searchParams.sort();
  return url.pathname + url.search;
}

const onTabPage = () => Object.values(PATHS).some((path) => path === window.location.pathname);

/**
 * A tab page's clientLoader. Opened from another tab, it shows the cached data at once, marked `stale` when old, and
 * useRefreshStale then asks the server. Opened from any other page (a test, the flashcards), it asks the server, as that
 * page may have changed the data. The page shown now again is a reload after a save, so it asks the server too.
 */
export async function tabClientLoader<T extends object>({
  request,
  serverLoader,
}: {
  request: Request;
  serverLoader: () => Promise<T>;
}): Promise<T & { stale?: true }> {
  const key = keyOf(request.url);
  const hit = cache.get(key) as { data: T; at: number } | undefined;
  const fresh = hit && Date.now() - hit.at < FRESH_MS;
  const prefetch = new URL(request.url).searchParams.has(PREFETCH);
  if (prefetch) {
    // React Router runs a prefetch again on every reload of the page, and after a navigation cancels it: only an empty
    // cache needs it.
    if (hit) return hit.data;
  } else if (hit && onTabPage() && key !== keyOf(window.location.href)) {
    return fresh ? hit.data : { ...hit.data, stale: true };
  }
  let load = pending.get(key) as Promise<T> | undefined;
  if (!load) {
    load = serverLoader().finally(() => pending.delete(key));
    pending.set(key, load);
  }
  let data: T;
  try {
    // A load on its way that failed or was cancelled (a navigation, an unmount) is asked again.
    data = await load.catch(() => serverLoader());
  } catch (error) {
    // A prefetch shows nothing, so its failure never reaches the page's error screen.
    if (prefetch) return {} as T;
    throw error;
  }
  cache.set(key, { data, at: Date.now() });
  return data;
}

/** Asks the server for the page's data when what shows is the cache's. Keeps the page's data for the next visit. */
export function useRefreshStale(data: object) {
  const { revalidate } = useRevalidator();
  useEffect(() => {
    if ("stale" in data) {
      void revalidate();
      return;
    }
    // The first page comes from the server rendering, which runs no clientLoader.
    const key = keyOf(window.location.href);
    if (!cache.has(key)) cache.set(key, { data, at: Date.now() });
  }, [data, revalidate]);
}

/**
 * Loads the other tabs at `level` into the cache once a tab page shows, so even the first switch to one shows at once.
 * Tabs already cached are left: their switch shows the cache, then the server's data.
 */
export function usePrefetchTabs(level: JlptLevel | null) {
  // One fetcher per tab: a fetcher's next load cancels the one on its way.
  const fetchers = [useFetcher(), useFetcher(), useFetcher(), useFetcher()];
  useEffect(() => {
    Object.values(PATHS).forEach((path, index) => {
      const to = tabHref(path, level);
      const key = keyOf(to);
      // A load on its way is not skipped: it may be one this effect's first run started, cancelled as React ran it again.
      if (key === keyOf(window.location.href) || cache.has(key)) return;
      const url = new URL(to, window.location.origin);
      // The grammar page is the index route: without `index`, the fetcher would load the tabs layout, which has no loader.
      if (path === PATHS.grammar) url.searchParams.set("index", "");
      url.searchParams.set(PREFETCH, "");
      void fetchers[index].load(url.pathname + url.search);
    });
    // Once per level: the fetchers change on every render.
  }, [level]);
}

/** Empties the cache, for the tests. */
export function clearTabCache() {
  cache.clear();
  pending.clear();
}
