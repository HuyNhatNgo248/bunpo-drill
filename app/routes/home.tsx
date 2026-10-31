import { msg } from "@lingui/core/macro";
import { redirect } from "react-router";
import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import { toSummary } from "~/lib/grading.server";
import { isTestLevel, JLPT_LEVELS } from "~/lib/payload";
import { levelStats, listTests, newestLevel } from "~/lib/tests.server";
import { localeFromMatches, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Mock tests`)} · 文法ドリル` }];
}

/** The tests on a page of the home list. */
export const PAGE_SIZE = 20;

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  // One level at a time: the one in ?level=, with tests or not, else the level of the newest test.
  // Not the top test's: a test of another level can sort above it.
  const level = JLPT_LEVELS.find((candidate) => candidate === params.get("level")) ?? (await newestLevel());
  if (!level || !isTestLevel(level)) {
    return { tests: [], stats: { total: 0, taken: 0, average: null, toReview: 0 }, level, page: 1, pages: 1 };
  }
  const page = Math.max(1, Math.trunc(Number(params.get("page"))) || 1);
  const [stats, tests] = await Promise.all([
    levelStats(level),
    listTests({ level, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  ]);
  const pages = Math.max(1, Math.ceil(stats.total / PAGE_SIZE));
  // A page past the last, from an old link, goes to the last page.
  if (page > pages) throw redirect(`/?level=${level}&page=${pages}`);
  return { tests: tests.map(toSummary), stats, level, page, pages };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home {...loaderData} />;
}
