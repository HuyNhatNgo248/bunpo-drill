import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import { toSummary } from "~/lib/grading.server";
import { LEVELS } from "~/lib/payload";
import { listTests } from "~/lib/tests.server";

export function meta() {
  return [{ title: "模擬試験 · 文法ドリル" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const all = (await listTests()).map(toSummary);
  // One level at a time: the one in ?level= if it has tests, else the level of the top test.
  const levels = LEVELS.filter((level) => all.some((test) => test.level === level));
  const asked = new URL(request.url).searchParams.get("level");
  const level = levels.find((candidate) => candidate === asked) ?? all[0]?.level ?? null;
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
