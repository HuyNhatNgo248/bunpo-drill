import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { PASS_PERCENT } from "~/lib/sections";
import type { ResultsView } from "~/lib/views";

/** The score, its percent (green from the pass line up), the number of wrong answers, and the score the time before. */
export function ScoreCard({ results }: { results: ResultsView }) {
  const wrong = results.total - results.score;
  const passed = results.percent >= PASS_PERCENT;
  const pass = PASS_PERCENT;
  const lastScore = results.previous && `${results.previous.score} / ${results.previous.total}`;
  const { t } = useLingui();

  return (
    <Card className="flex flex-col gap-3.5 p-4 md:gap-1.5 md:p-6">
      <div className="hidden text-caption text-muted-foreground md:block">
        <Trans>Score</Trans>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2 md:gap-2.5">
          <span className="text-4xl font-bold tracking-tighter md:text-score">
            {results.score} / {results.total}
          </span>
          <span className={cn("text-base font-semibold md:text-lg", passed ? "text-success" : "text-warning")}>
            {results.percent}%
          </span>
        </div>
        <span className="text-caption text-muted-foreground md:hidden">
          <Trans>{wrong} wrong</Trans>
        </span>
      </div>
      <Progress value={results.percent} aria-label={t`Score`} className="h-2" />
      <div className={cn("flex justify-between gap-3 text-caption text-muted-foreground", !lastScore && "hidden md:flex")}>
        <span className="hidden md:inline">
          <Trans>
            {wrong} wrong · pass line {pass}%
          </Trans>
        </span>
        {lastScore && (
          <span>
            <Trans>Last time {lastScore}</Trans>
          </span>
        )}
      </div>
    </Card>
  );
}
