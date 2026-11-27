import { useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { PASS_PERCENT } from "~/lib/sections";
import { cn } from "~/lib/utils";
import type { TestSummary } from "~/lib/views";
import { TestMenu } from "./TestMenu";

/**
 * One test of a series as a tile: its number over its score (green from the pass line, amber under it) or how far it got
 * (in the soft red of a test under way). Read out, it is the test's title and that. It opens the test as a row does, and the
 * admin renames or deletes it from the menu of a right click on it.
 */
export function TestTile({ test, number, isAdmin = false }: { test: TestSummary; number: number; isAdmin?: boolean }) {
  const { t } = useLingui();
  const { answered, result } = test;
  const total = test.questionCount;
  const inProgress = !result && answered !== null;
  const passed = result !== null && result.percent >= PASS_PERCENT;
  const status = result ? `${result.score} / ${result.total}` : inProgress ? t`${answered} / ${total} answered` : t`Not taken`;

  const tile = (
    <Link
      to={result ? `/tests/${test.id}/results` : `/tests/${test.id}`}
      prefetch="intent"
      aria-label={`${test.title} ${status}`}
      title={test.title}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 rounded-lg border bg-card text-foreground no-underline shadow-piece transition-colors hover:bg-muted/60",
        inProgress && "border-primary-border bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/70",
        passed && "border-success-border bg-success-soft text-success hover:bg-success-soft/70",
        result && !passed && "border-warning/50 text-warning",
      )}
    >
      <span className="text-lg leading-none font-bold tabular-nums">{number}</span>
      {(result || inProgress) && (
        <span className="text-2xs leading-none font-medium tabular-nums">{result ? `${result.score}/${result.total}` : `${answered}/${total}`}</span>
      )}
    </Link>
  );
  return isAdmin ? <TestMenu test={test}>{tile}</TestMenu> : tile;
}
