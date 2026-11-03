import { msg } from "@lingui/core/macro";
import { redirect, type ShouldRevalidateFunction } from "react-router";
import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import { requireUserId } from "~/lib/auth.server";
import { toSummary } from "~/lib/grading.server";
import { isTestLevel, JLPT_LEVELS } from "~/lib/payload";
import { levelStats, listTests, newestLevel } from "~/lib/tests.server";
import { lastTabOf, ownerId, saveLastTab } from "~/lib/users.server";
import { localeFromMatches, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Mock tests`)} · 文法ドリル` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const userId = await requireUserId(request);
  const named = JLPT_LEVELS.find((candidate) => candidate === params.get("level"));
  // Opened with no level (the app's address, or a sign-in): the tab the user last opened, on any device.
  const [last, newest] = named ? [null, null] : await Promise.all([lastTabOf(userId), newestLevel()]);
  if (last?.subject === "kanji") throw redirect(`/kanji?level=${last.level}`);
  // One level at a time: the one named, with tests or not, else the last one opened, else the level of the newest test.
  // Not the top test's: a test of another level can sort above it.
  const level = named ?? last?.level ?? newest;
  const latestFirst = params.get("sort") === "latest";
  // Not awaited: the write is the slowest query, and a missed save only costs the next visit its tab.
  if (level) saveLastTab(userId, { subject: "grammar", level }).catch(console.error);
  if (!level || !isTestLevel(level)) {
    return { tests: [], stats: { total: 0, taken: 0, average: null, toReview: 0 }, level, latestFirst, isAdmin: false };
  }
  const [stats, tests, owner] = await Promise.all([levelStats(level, userId), listTests(userId, { level, latestFirst }), ownerId()]);
  // Only shows the delete buttons; DELETE /api/tests/:id checks the admin again.
  return { tests: tests.map(toSummary), stats, level, latestFirst, isAdmin: userId === owner };
}

/** A search changes only `q`, which the page filters by itself, so the tests aren't loaded again for it. */
export const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }) => {
  const withoutQuery = (url: URL) => {
    const params = new URLSearchParams(url.search);
    params.delete("q");
    return `${url.pathname}?${params}`;
  };
  const searched = currentUrl.searchParams.get("q") !== nextUrl.searchParams.get("q");
  return !formMethod && searched && withoutQuery(currentUrl) === withoutQuery(nextUrl) ? false : defaultShouldRevalidate;
};

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home {...loaderData} />;
}
