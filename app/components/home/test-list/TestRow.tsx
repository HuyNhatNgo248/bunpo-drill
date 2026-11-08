import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Progress } from "~/components/ui/progress";
import { PASS_PERCENT } from "~/lib/sections";
import type { TestSummary } from "~/lib/views";
import { rowHeading } from "./helpers/rowHeading";
import { TestMenu } from "./TestMenu";

/**
 * One test, a row of its week: its title (without the week), a line under it, and what is next for it. In progress: how
 * far it got, and Continue. Not taken: its size, and Start. Taken: its size, its score (green from the pass line), and
 * its results (where it can be retaken and its grammar reviewed). Start is the one filled button, as in the kanji and reading tabs. The whole row opens it. The admin renames or deletes it from the menu of a right click on it.
 */
export function TestRow({ test, isAdmin = false }: { test: TestSummary; isAdmin?: boolean }) {
  const { t } = useLingui();
  const { answered, result } = test;
  const total = test.questionCount;
  const inProgress = !result && answered !== null;
  // One width, so the buttons of a week line up.
  const button = cn(buttonVariants({ variant: result || inProgress ? "outline" : "default" }), "min-w-24");

  const row = (
    <li className="relative flex min-h-16 items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/60">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Its ::after covers the row, so the whole row opens the test; the buttons are only its look, under it. */}
        <Link
          to={result ? `/tests/${test.id}/results` : `/tests/${test.id}`}
          prefetch="intent"
          className="truncate text-base font-semibold text-foreground no-underline after:absolute after:inset-0"
        >
          <span className="sr-only">{test.title}</span>
          <span aria-hidden="true">{rowHeading(test.title, test.weeks).title}</span>
        </Link>
        {inProgress ? (
          <span className="flex items-center gap-2.5">
            {/* The numbers say it; the bar is for the eye. */}
            <Progress aria-hidden="true" value={(answered / total) * 100} className="h-1.5 max-w-56" />
            <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
              <Trans>
                {answered} / {total} answered
              </Trans>
            </span>
          </span>
        ) : (
          <span className="text-caption tabular-nums text-muted-foreground">
            <Plural value={total} one="# question" other="# questions" />
          </span>
        )}
      </div>
      {result && (
        <Badge
          variant="outline"
          className={cn(
            "text-sm font-semibold tabular-nums",
            result.percent >= PASS_PERCENT ? "border-success-border bg-success-soft text-success" : "text-warning",
          )}
        >
          {result.score} / {result.total}
        </Badge>
      )}
      <span className={button}>{result ? t`Results` : inProgress ? t`Continue` : t`Start`}</span>
    </li>
  );
  return isAdmin ? <TestMenu test={test}>{row}</TestMenu> : row;
}
