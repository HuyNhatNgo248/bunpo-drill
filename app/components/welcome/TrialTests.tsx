import { Plural, Trans } from "@lingui/react/macro";
import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { LEVELS } from "~/lib/payload";
import type { TrialSummary } from "~/lib/views";

/** The full mock tests a visitor can take without an account: a list per level, side by side. */
export function TrialTests({ tests }: { tests: TrialSummary[] }) {
  return (
    <section aria-labelledby="trial-tests" className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-2">
        <h2 id="trial-tests" className="text-xl font-bold text-balance">
          <Trans>Try a full mock test, no account needed</Trans>
        </h2>
        <p className="max-w-160 leading-sentence text-subtle-foreground">
          <Trans>All three parts, graded as soon as you submit. Your answers aren't saved, so you can take each test as often as you like.</Trans>
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 md:gap-6">
        {LEVELS.map((level) => {
          const own = tests.filter((test) => test.level === level);
          if (own.length === 0) return null;
          // No point is in two of a level's tests, so their counts add up to the points they cover; shown to the nearest 10.
          const points = Math.round(own.reduce((sum, test) => sum + test.patternCount, 0) / 10) * 10;
          return (
            <div key={level} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h3 className="rounded-full border border-indigo/25 bg-indigo/10 px-3 py-0.5 text-sm font-semibold text-indigo">{level}</h3>
                <p className="text-caption text-muted-foreground">
                  <Trans>About {points} grammar points</Trans>
                </p>
              </div>
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {own.map((test) => (
                  <TestItem key={test.id} test={test} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** One test in its level's list: its title and size, and the way in. The whole row opens it. */
function TestItem({ test }: { test: TrialSummary }) {
  const total = test.questionCount;
  return (
    <li className="relative flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 has-focus-visible:bg-muted/60 md:px-5">
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* Its ::after covers the row, so a tap anywhere on it opens the test. */}
        <Link to={`/try/${test.id}`} className="text-foreground no-underline outline-none after:absolute after:inset-0">
          <span className="sr-only">{test.level} </span>
          <span lang="ja" className="font-jp text-base font-semibold">
            {test.title}
          </span>
        </Link>
        <span className="text-caption text-muted-foreground">
          <Plural value={total} one="# question" other="# questions" />
        </span>
      </div>
      {/* The link is the whole row; this only looks like its button. */}
      <span aria-hidden="true" className={buttonVariants({ size: "sm" })}>
        <Trans>Start</Trans>
      </span>
    </li>
  );
}
