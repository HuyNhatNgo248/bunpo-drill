import { msg } from "@lingui/core/macro";
import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import { toSummary } from "~/lib/grading.server";
import { LEVELS } from "~/lib/payload";
import { listTests } from "~/lib/tests.server";
import { localeFromMatches, translate } from "~/lib/i18n";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Mock tests`)} · 文法ドリル` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const saved = await listTests();
  const all = saved.map(toSummary);
  // One level at a time: the one in ?level= if it has tests, else the level of the newest test.
  // Not the top test's: a drag places only the tests of one level, which brings the other level's to the top.
  const levels = LEVELS.filter((level) => all.some((test) => test.level === level));
  const asked = new URL(request.url).searchParams.get("level");
  const newest = saved.reduce<(typeof saved)[number] | undefined>((a, b) => (!a || b.createdAt > a.createdAt ? b : a), undefined);
  const level = levels.find((candidate) => candidate === asked) ?? newest?.payload.level ?? null;
  const tests = all.filter((test) => test.level === level);
  const taken = tests.filter((test) => test.result);
  const average = taken.length
    ? Math.round(taken.reduce((sum, test) => sum + test.result!.percent, 0) / taken.length)
    : null;
  const toReview = new Set(
    taken.flatMap((test) => test.review.filter((chip) => !chip.reviewed).map((chip) => chip.pattern)),
  ).size;
  return { tests, stats: { average, toReview, taken: taken.length }, level, levels };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home {...loaderData} />;
}
