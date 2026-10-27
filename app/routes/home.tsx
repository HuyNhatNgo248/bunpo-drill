import type { Route } from "./+types/home";
import { Home } from "~/components/home";
import { toSummary } from "~/lib/grading.server";
import { listTests } from "~/lib/tests.server";

export function meta() {
  return [{ title: "模擬試験 · 文法ドリル" }];
}

export async function loader() {
  const tests = (await listTests()).map(toSummary);
  const taken = tests.filter((test) => test.result);
  const average = taken.length
    ? Math.round(taken.reduce((sum, test) => sum + test.result!.percent, 0) / taken.length)
    : null;
  const toReview = new Set(
    taken.flatMap((test) => test.review.filter((chip) => !chip.reviewed).map((chip) => chip.pattern)),
  ).size;
  return { tests, stats: { average, toReview, taken: taken.length } };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home tests={loaderData.tests} stats={loaderData.stats} />;
}
