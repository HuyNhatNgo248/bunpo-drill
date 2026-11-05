import { Trans } from "@lingui/react/macro";
import { Card } from "~/components/ui/card";
import { READING_GROUP_TITLES } from "~/lib/sections";
import { clock, cn } from "~/lib/utils";
import type { ReadingType } from "~/lib/reading-payload";
import type { ResultsView } from "~/lib/views";

/**
 * A reading set's time: all of it against the target, then each passage's on a bar with its target marked, and the
 * tip of each passage that took longer than its target. Nothing for a set that wasn't timed.
 */
export function TimeCard({ results }: { results: ResultsView }) {
  const several = results.sections.length > 1;
  const passages = results.sections.flatMap((section) =>
    section.groups.flatMap((group) =>
      group.reading?.seconds == null
        ? []
        : [{ ...group.reading, seconds: group.reading.seconds, name: `${several ? READING_GROUP_TITLES[section.type as ReadingType] : ""}（${group.reading.num}）` }],
    ),
  );
  if (!passages.length) return null;
  const spent = passages.reduce((sum, passage) => sum + passage.seconds, 0);
  const target = passages.reduce((sum, passage) => sum + passage.targetSeconds, 0);
  const over = clock(Math.abs(spent - target));
  const goal = clock(target);
  const slow = passages.filter((passage) => passage.seconds > passage.targetSeconds && passage.tip);

  return (
    <Card className="flex flex-col gap-3.5 p-4 md:gap-4 md:p-6">
      <div className="flex flex-col gap-1.5">
        <div className="hidden text-caption text-muted-foreground md:block">
          <Trans>Time</Trans>
        </div>
        <div className="flex items-baseline gap-2 md:gap-2.5">
          <span className="text-4xl font-bold tracking-tighter tabular-nums md:text-score">{clock(spent)}</span>
          <span className={cn("text-base font-semibold md:text-lg", spent > target ? "text-warning" : "text-success")}>
            {spent > target ? <Trans>{over} over</Trans> : <Trans>{over} to spare</Trans>}
          </span>
        </div>
        <span className="text-caption text-muted-foreground">
          <Trans>Target {goal}</Trans>
        </span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {passages.map((passage) => (
          <li key={passage.index} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 md:gap-4">
            <span lang="ja" className="min-w-10 font-jp text-sm font-semibold">
              {passage.name}
            </span>
            <TimeBar seconds={passage.seconds} target={passage.targetSeconds} />
            <span className="text-sm tabular-nums">
              <span className={cn("font-semibold", passage.seconds > passage.targetSeconds && "text-warning")}>{clock(passage.seconds)}</span>
              <span className="text-muted-foreground"> / {clock(passage.targetSeconds)}</span>
            </span>
          </li>
        ))}
      </ul>

      {slow.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t pt-3.5">
          {slow.map((passage) => (
            <li key={passage.index} className="text-sm leading-relaxed text-secondary-foreground">
              <span lang="ja" className="font-jp font-semibold">
                {passage.name}
              </span>{" "}
              <span lang="en">{passage.tip}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** The time on a bar as long as the longer of it and the target, the target marked; amber when over it. */
function TimeBar({ seconds, target }: { seconds: number; target: number }) {
  const longest = Math.max(seconds, target, 1);
  return (
    // The numbers beside it say it; the bar is for the eye.
    <span aria-hidden="true" className="relative h-2 rounded-full bg-muted">
      <span className={cn("absolute inset-y-0 left-0 rounded-full", seconds > target ? "bg-warning" : "bg-indigo")} style={{ width: `${(seconds / longest) * 100}%` }} />
      <span className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${(target / longest) * 100}%` }} />
    </span>
  );
}
