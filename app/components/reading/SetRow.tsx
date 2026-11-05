import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { clock, cn } from "~/lib/utils";
import type { ReadingSetSummary } from "~/lib/views";

/**
 * One reading set, a row like a mock test's. Not taken: its size and its time, and Start. In progress: how far it got,
 * and Continue. Taken: its time against its target, its score, and its results. The whole row opens it.
 */
export function SetRow({ set }: { set: ReadingSetSummary }) {
  const { t } = useLingui();
  const { answered, result, seconds, targetSeconds } = set;
  const total = set.questionCount;
  const minutes = Math.round(targetSeconds / 60);
  const goal = clock(targetSeconds);
  const time = seconds === null ? null : clock(seconds);
  const inProgress = !result && answered !== null;
  return (
    <li className="relative flex min-h-16 items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/60">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Its ::after covers the row, so the whole row opens the set; the buttons are only its look, under it. */}
        <Link
          to={result ? `/tests/${set.id}/results` : `/tests/${set.id}`}
          prefetch="intent"
          lang="ja"
          className="truncate font-jp text-base font-semibold text-foreground no-underline after:absolute after:inset-0"
        >
          {set.title}
        </Link>
        {inProgress && (
          <span className="flex items-center gap-2.5">
            {/* The numbers say it; the bar is for the eye. */}
            <Progress aria-hidden="true" value={(answered / total) * 100} className="h-1.5 max-w-56 *:bg-indigo" />
            <span className="shrink-0 text-caption tabular-nums text-indigo">
              <Trans>
                {answered} / {total} answered
              </Trans>
            </span>
          </span>
        )}
        {result && (
          <span className="text-caption text-muted-foreground tabular-nums">
            <Plural value={total} one="# question" other="# questions" />
            {time !== null && (
              <>
                {" · "}
                <span className={cn(seconds! > targetSeconds && "text-warning")}>{time}</span>
                {", "}
                <Trans>target {goal}</Trans>
              </>
            )}
          </span>
        )}
      </div>
      {result ? (
        <>
          <Badge variant="outline" className="text-sm font-semibold tabular-nums">
            {result.score} / {result.total}
          </Badge>
          <span className="flex shrink-0 items-center gap-0.5 font-semibold text-indigo">
            {t`Results`}
            <ChevronRight aria-hidden="true" className="size-4" />
          </span>
        </>
      ) : inProgress ? (
        <span className="flex shrink-0 items-center gap-0.5 font-semibold text-indigo">
          {t`Continue`}
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      ) : (
        <>
          <span className="hidden shrink-0 text-caption tabular-nums text-muted-foreground sm:inline">
            <Plural value={total} one="# question" other="# questions" /> · <Trans>{minutes} min</Trans>
          </span>
          <span className={buttonVariants()}>{t`Start`}</span>
        </>
      )}
    </li>
  );
}
