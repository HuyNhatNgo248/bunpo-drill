import { Trans } from "@lingui/react/macro";
import { ReadingBody } from "~/components/reading-passage";
import { Card } from "~/components/ui/card";
import { clock, cn } from "~/lib/utils";
import type { ReadingPassageView } from "~/lib/views";
import { trackPassageHeight } from "./helpers/passageHeight";

/**
 * A reading passage in the quiz: its number, the time spent on it against its target (in amber once over), and its
 * text. Like the grammar passage, it sticks below the header or the progress bar and scrolls inside itself when tall.
 */
export function ReadingPassageCard({ passage, seconds }: { passage: ReadingPassageView; seconds: number }) {
  const time = clock(seconds);
  const goal = clock(passage.targetSeconds);
  return (
    <Card
      id={`passage-r${passage.index}`}
      ref={trackPassageHeight}
      className="sticky top-16 z-10 mt-1 flex max-h-passage flex-col gap-3 overflow-y-auto p-4 shadow-raised md:top-24 md:max-h-passage-desktop md:p-6"
    >
      <div className="flex items-baseline justify-between gap-3 text-caption text-muted-foreground">
        <span lang="ja" className="font-jp font-semibold text-secondary-foreground">
          （{passage.num}）
        </span>
        <span className={cn("tabular-nums", seconds > passage.targetSeconds && "text-warning")}>
          <Trans>
            {time} on it · target {goal}
          </Trans>
        </span>
      </div>
      <ReadingBody passage={passage} />
    </Card>
  );
}
