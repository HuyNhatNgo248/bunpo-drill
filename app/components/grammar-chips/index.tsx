import { cn } from "~/lib/utils";
import type { ReviewChip } from "~/lib/views";
import { GrammarChip } from "./GrammarChip";

/**
 * Grammar from wrong answers. Tapping a chip opens a popover with where the
 * point is in the 文法ノート and a button to mark it reviewed (the chip turns red); with no `testId` (a trial test), no button.
 */
export function GrammarChips({ testId, chips, className }: { testId: string | null; chips: ReviewChip[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <GrammarChip key={chip.grammarId} chip={chip} targets={testId ? [{ testId, grammarId: chip.grammarId }] : []} />
      ))}
    </div>
  );
}
