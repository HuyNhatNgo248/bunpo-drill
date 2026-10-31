import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

/**
 * Desktop: a count (answered, cards done) and its bar, pinned near the top while the page scrolls. `aside` sits at the
 * right of both: the flashcards' side switch.
 */
export function ProgressCard({ percent, label, aside, children }: { percent: number; label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    // h-18 at top-3 ends 84px down; the quiz's question list and passages stick at top-24 (96px), just below it.
    // z-20, over the passages' z-10: a passage whose questions have gone by scrolls away under it, not over it.
    <Card className="sticky top-3 z-20 hidden h-18 items-center gap-5 px-5 shadow-raised md:flex">
      <div className="flex flex-1 flex-col gap-2.5">
        <span className="text-caption font-medium">{children}</span>
        <Progress value={percent} minFill={1} aria-label={label} className="h-2" />
      </div>
      {aside}
    </Card>
  );
}
