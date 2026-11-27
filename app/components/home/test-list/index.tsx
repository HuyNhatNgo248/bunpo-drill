import { useLingui } from "@lingui/react/macro";
import { InfoLink } from "~/components/info/InfoLink";
import { cn } from "~/lib/utils";
import type { TestSummary } from "~/lib/views";
import { Figures } from "./Figures";
import { reviewList } from "./helpers/reviewList";
import { seriesList } from "./helpers/seriesList";
import { NextTest } from "./NextTest";
import { SeriesBoard } from "./SeriesBoard";
import { TestRow } from "./TestRow";
import { WeekReview } from "./WeekReview";

/**
 * A level's `tests` (at least one) under 総合: the test to take next (the one under way, else the first not taken) beside
 * how the tests went; then each series (tests named alike but for a number) as a board of tiles, the other tests as rows,
 * and the grammar of the 文法ノート that any test got wrong. The server sends the tests in order.
 */
export function TestList({ tests, isAdmin = false }: { tests: TestSummary[]; isAdmin?: boolean }) {
  const { t } = useLingui();
  const { series, rest } = seriesList(tests);
  // In the order the page shows them, so "next" is the first tile or row left to take.
  const shown = [...series.flatMap((one) => one.tests.map(({ test }) => test)), ...rest];
  const next = shown.find((test) => !test.result && test.answered !== null) ?? shown.find((test) => !test.result);
  const review = reviewList(tests);
  const legend = [
    { label: t`Not taken`, swatch: "bg-card" },
    { label: t`In progress`, swatch: "border-primary-border bg-primary-soft" },
    { label: t`Passed`, swatch: "border-success-border bg-success-soft" },
    { label: t`Below the pass line`, swatch: "border-warning/50 bg-card" },
  ];

  return (
    <section aria-labelledby="tests-heading" className="flex min-w-0 flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="tests-heading" className="text-xl font-bold md:text-2xl">
          総合
        </h2>
        <div className="flex items-center gap-4">
          {series.length > 0 && (
            <>
              {/* The tiles say it again when read out; the key is for the eye. */}
              <ul aria-hidden="true" className="hidden items-center gap-3 text-caption text-muted-foreground md:flex">
                {legend.map(({ label, swatch }) => (
                  <li key={label} className="flex items-center gap-1.5">
                    <span className={cn("size-3 rounded-sm border", swatch)} />
                    {label}
                  </li>
                ))}
              </ul>
              <span aria-hidden="true" className="hidden h-4 w-px bg-input md:block" />
            </>
          )}
          <InfoLink subject="grammar" />
        </div>
      </div>
      <div className="flex flex-col gap-4 md:flex-row">
        {next && <NextTest test={next} />}
        <Figures tests={tests} className={next ? "md:w-96 md:shrink-0" : "flex-1"} />
      </div>
      {series.map((one) => (
        <SeriesBoard key={one.name} series={one} isAdmin={isAdmin} />
      ))}
      {rest.length > 0 && (
        <section aria-labelledby="tests-rest" className="flex flex-col gap-2.5">
          {/* Named only beside series; alone, they are simply the tests. */}
          <h3 id="tests-rest" className={cn("text-caption font-semibold text-subtle-foreground", series.length === 0 && "sr-only")}>
            {series.length > 0 ? t`Other tests` : t`Tests`}
          </h3>
          <ul className="grid overflow-hidden rounded-xl border bg-card md:grid-cols-2">
            {rest.map((test) => (
              <TestRow key={test.id} test={test} isAdmin={isAdmin} />
            ))}
          </ul>
        </section>
      )}
      {review.length > 0 && <WeekReview items={review} />}
    </section>
  );
}
