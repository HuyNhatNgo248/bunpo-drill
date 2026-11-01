import { msg } from "@lingui/core/macro";
import { redirect } from "react-router";
import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import { requireUserId } from "~/lib/auth.server";
import { toSummary } from "~/lib/grading.server";
import { tabFromCookie } from "~/lib/lastTab";
import { isTestLevel, JLPT_LEVELS } from "~/lib/payload";
import { levelStats, listTests, newestLevel } from "~/lib/tests.server";
import { localeFromMatches, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Mock tests`)} · 文法ドリル` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const named = JLPT_LEVELS.find((candidate) => candidate === params.get("level"));
  // Opened with no level (the app's address, or a sign-in): the tab last opened in this browser.
  const last = named ? null : tabFromCookie(request.headers.get("Cookie"));
  if (last?.subject === "kanji") throw redirect(`/kanji?level=${last.level}`);
  // One level at a time: the one named, with tests or not, else the last one opened, else the level of the newest test.
  // Not the top test's: a test of another level can sort above it.
  const level = named ?? last?.level ?? (await newestLevel());
  const latestFirst = params.get("sort") === "latest";
  if (!level || !isTestLevel(level)) {
    return { tests: [], stats: { total: 0, taken: 0, average: null, toReview: 0 }, level, latestFirst };
  }
  const userId = await requireUserId(request);
  const [stats, tests] = await Promise.all([levelStats(level, userId), listTests(userId, { level, latestFirst })]);
  return { tests: tests.map(toSummary), stats, level, latestFirst };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home {...loaderData} />;
}
