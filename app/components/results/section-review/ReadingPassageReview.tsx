import { Trans } from "@lingui/react/macro";
import { useLocation } from "react-router";
import { ReadingBody } from "~/components/reading-passage";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { trackPassageHeight } from "~/components/quiz/helpers/passageHeight";
import type { ReadingPassageView } from "~/lib/views";

/** A reading passage graded: its text with the sentence that decides each of its answers tinted green. It pins at `className`'s top. */
export function ReadingPassageReview({ passage, className }: { passage: ReadingPassageView; className?: string }) {
  const id = `passage-r${passage.index}`;
  // Opened from a note's link to this passage.
  const arrived = useLocation().hash === `#${id}`;
  return (
    <Card id={id} ref={trackPassageHeight} className={cn("sticky z-10 mt-1 flex max-h-passage scroll-mt-4 flex-col gap-3 overflow-y-auto p-4 shadow-raised md:max-h-passage-desktop md:scroll-mt-6 md:p-5", className, arrived && "animate-arrived motion-reduce:animate-none")}>
      <div className="flex items-baseline justify-between gap-3 text-caption text-muted-foreground">
        <span lang="ja" className="font-jp font-semibold text-secondary-foreground">
          （{passage.num}）
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-success-soft shadow-[inset_0_-2px_0_var(--success)]" />
          <Trans>Where the answer is</Trans>
        </span>
      </div>
      <ReadingBody passage={passage} />
    </Card>
  );
}
