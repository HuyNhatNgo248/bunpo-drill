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
  // Not awaited: the write is the slowest query, and a missed save only costs the next visit its tab.
  if (level) saveLastTab(userId, { subject: "grammar", level }).catch(console.error);
  if (!level || !isTestLevel(level)) {
    return { tests: [], stats: { total: 0, taken: 0, average: null, toReview: 0 }, level, isAdmin: false };
  }
  const [stats, tests, owner] = await Promise.all([levelStats(level, userId), listTests(userId, { level }), ownerId()]);
  // Only shows the rename and delete menu; /api/tests/:id checks the admin again.
  return { tests: tests.map(toSummary), stats, level, isAdmin: userId === owner };
}

/** A week picked (`week`) the page shows by itself, so the tests aren't loaded again for it. */
export const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }) => {
  const withoutWeek = (url: URL) => {
    const params = new URLSearchParams(url.search);
    params.delete("week");
    return `${url.pathname}?${params}`;
  };
  const picked = currentUrl.search !== nextUrl.search;
  return !formMethod && picked && withoutWeek(currentUrl) === withoutWeek(nextUrl) ? false : defaultShouldRevalidate;
};

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home {...loaderData} />;
}
