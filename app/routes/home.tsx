import { msg } from "@lingui/core/macro";
import type { ShouldRevalidateFunction } from "react-router";
import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import type { TabsHandle } from "~/components/layout/TabsLayout";
import { requireUserId } from "~/lib/auth.server";
import { toSummary } from "~/lib/grading.server";
import { isTestLevel, JLPT_LEVELS } from "~/lib/payload";
import { listTests, newestLevel } from "~/lib/tests.server";
import { lastTabOf, ownerId, saveLastTab } from "~/lib/users.server";
import { titleMeta } from "~/lib/i18n";

export const meta = titleMeta(msg`Mock tests`);

export const handle: TabsHandle = { levels: true };

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const userId = await requireUserId(request);
  const named = JLPT_LEVELS.find((candidate) => candidate === params.get("level"));
  // Opened with no level (the app's address, or a sign-in): the level the user last opened, grammar or kanji, on any device.
  const [last, newest] = named ? [null, null] : await Promise.all([lastTabOf(userId), newestLevel()]);
  // One level at a time: the one named, with tests or not, else the last one opened, else the level of the newest test.
  // Not the top test's: a test of another level can sort above it.
  const level = named ?? last?.level ?? newest;
  // Not awaited: the write is the slowest query, and a missed save only costs the next visit its tab.
  if (level) saveLastTab(userId, { subject: "grammar", level }).catch(console.error);
  if (!level || !isTestLevel(level)) {
    return { tests: [], level, isAdmin: false };
  }
  const [tests, owner] = await Promise.all([listTests(userId, { level }), ownerId()]);
  // Only shows the rename and delete menu; /api/tests/:id checks the admin again.
  return { tests: tests.map(toSummary), level, isAdmin: userId === owner };
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
