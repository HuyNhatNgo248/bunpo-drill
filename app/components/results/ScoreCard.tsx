import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { PASS_PERCENT } from "~/lib/sections";
import type { ResultsView } from "~/lib/views";

/** The score, its percent (green from the pass line up), and the number of wrong answers. */
export function ScoreCard({ results }: { results: ResultsView }) {
  const wrong = results.total - results.score;
  const passed = results.percent >= PASS_PERCENT;

  return (
    <Card className="flex flex-col gap-3.5 p-4 md:gap-1.5 md:p-6">
      <div className="hidden text-caption text-muted-foreground md:block">得点</div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2 md:gap-2.5">
          <span className="text-4xl font-bold tracking-tighter md:text-score">
            {results.score} / {results.total}
          </span>
          <span className={cn("text-base font-semibold md:text-lg", passed ? "text-success" : "text-warning")}>
            {results.percent}%
          </span>
        </div>
        <span className="text-caption text-muted-foreground md:hidden">不正解 {wrong}問</span>
      </div>
      <Progress value={results.percent} aria-label="得点" className="h-2" />
      <div className="hidden text-caption text-muted-foreground md:block">
        不正解 {wrong}問 · 合格ライン {PASS_PERCENT}%
      </div>
    </Card>
  );
}
