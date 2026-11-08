import { Trans, useLingui } from "@lingui/react/macro";
import { useSearchParams } from "react-router";
import { InfoLink } from "~/components/info/InfoLink";
import { Rail } from "~/components/Rail";
import { Badge } from "~/components/ui/badge";
import type { TestSummary } from "~/lib/views";
import { reviewList } from "./helpers/reviewList";
import { TestRow } from "./TestRow";
import { WeekReview } from "./WeekReview";

/** The tests split into runs of the same first week. The server sorts by it, so each week is one run. */
function byWeek(tests: TestSummary[]) {
  const runs: { week: number; tests: TestSummary[] }[] = [];
  for (const test of tests) {
    const last = runs.at(-1);
    if (last?.week === test.weeks[0]) last.tests.push(test);
    else runs.push({ week: test.weeks[0], tests: [test] });
  }
  return runs;
}

/**
 * A level's `tests` (at least one), one week at a time: the weeks to pick from, then the week picked: its tests split
 * into the ones in progress, the ones not taken and the taken ones, then the grammar of its part of the 文法ノート that
 * any test got wrong. The week is in the address (`week`); without one, or
 * one with no tests, it is the first with a test left to take. The server sends the tests in order.
 */
export function TestList({ tests, isAdmin = false }: { tests: TestSummary[]; isAdmin?: boolean }) {
  const { t } = useLingui();
  const [params] = useSearchParams();
  const weeks = byWeek(tests);
  const picked = Number(params.get("week"));
  const shown =
    weeks.find(({ week }) => week === picked) ?? weeks.find((week) => week.tests.some((test) => !test.result)) ?? weeks[0];
  const { week } = shown;
  const total = shown.tests.length;
  const groups = [
    { key: "in-progress", title: t`In progress`, tests: shown.tests.filter((test) => !test.result && test.answered !== null) },
    { key: "not-taken", title: t`Not taken`, tests: shown.tests.filter((test) => !test.result && test.answered === null) },
    { key: "taken", title: t`Taken`, tests: shown.tests.filter((test) => test.result) },
  ];
  const taken = groups[2].tests.length;
  const review = reviewList(tests).filter((item) => item.chip.week === week);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
      <Rail
        label={t`Weeks`}
        param="week"
        current={week}
        items={weeks.map(({ week, tests }) => ({
          value: week,
          label: <Trans>Week {week}</Trans>,
          done: tests.filter((test) => test.result).length,
          total: tests.length,
        }))}
      />
      <section aria-labelledby="tests-week" className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="tests-week" className="text-xl font-bold md:text-2xl">
            <Trans>Week {week}</Trans>
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-caption text-muted-foreground tabular-nums">
              <Trans>
                {taken} / {total} taken
              </Trans>
            </span>
            <span aria-hidden="true" className="h-4 w-px bg-input" />
            <InfoLink subject="grammar" />
          </div>
        </div>
        {groups.map(
          (group) =>
            group.tests.length > 0 && (
              <section key={group.key} aria-labelledby={`tests-${group.key}`} className="flex flex-col gap-2.5">
                <h3 id={`tests-${group.key}`} className="flex items-center gap-2 text-caption font-semibold text-subtle-foreground">
                  {group.title} <Badge variant="count">{group.tests.length}</Badge>
                </h3>
                <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                  {group.tests.map((test) => (
                    <TestRow key={test.id} test={test} isAdmin={isAdmin} />
                  ))}
                </ul>
              </section>
            ),
        )}
        {review.length > 0 && <WeekReview key={week} items={review} />}
      </section>
    </div>
  );
}
