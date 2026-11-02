import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { GrammarChips } from "~/components/grammar-chips";
import { NumberTile } from "~/components/NumberTile";
import { RetakeButton, RetakeDialog } from "~/components/RetakeButton";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import type { TestSummary } from "~/lib/views";
import { rowHeading } from "./helpers/rowHeading";

/**
 * One test: its week in a tile, its title and last score, how far it got when it is in progress, and its buttons: Start is solid, Continue an outline. Review opens its grammar chips.
 */
export function TestRow({ test }: { test: TestSummary }) {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  // The retake picked from the menu, asked about in its dialog.
  const [asking, setAsking] = useState(false);
  const [wrongOnly, setWrongOnly] = useState(false);
  const ask = (wrong: boolean) => {
    setWrongOnly(wrong);
    setAsking(true);
  };
  const { answered } = test;
  const inProgress = answered !== null;
  const quizHref = `/tests/${test.id}`;
  const total = test.questionCount;
  const reviewCount = test.review.length;
  const missed = test.result !== null && test.result.score < test.result.total;
  const lastScore = test.previous && `${test.previous.score} / ${test.previous.total}`;
  const heading = rowHeading(test.title, test.weeks);

  return (
    <li className="relative isolate flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:p-5 md:last:border-b-0">
      {/* Its ::after fills the row under the buttons, so the whole row opens the test but the buttons still work. */}
      <Link
        to={test.result ? `${quizHref}/results` : quizHref}
        prefetch="intent"
        className="flex min-w-0 flex-1 items-start gap-3 text-foreground no-underline after:absolute after:inset-0 after:-z-10 md:flex-row-title md:items-center md:gap-4"
      >
        <NumberTile value={heading.week} label={<Trans>week</Trans>} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="sr-only">{test.title}</span>
            <span aria-hidden="true" className="text-base font-semibold">
              {heading.title}
            </span>
            {test.result && (
              <Badge variant="outline">
                {test.result.score} / {test.result.total}
              </Badge>
            )}
            {inProgress && !test.result && (
              <Badge variant="progress" className="tabular-nums">
                <Trans>
                  In progress {answered} / {total}
                </Trans>
              </Badge>
            )}
          </div>
          <div className="text-caption text-muted-foreground">
            <Plural value={total} one="# question" other="# questions" />
            {lastScore && (
              <span>
                {" · "}
                <Trans>Last time {lastScore}</Trans>
              </span>
            )}
          </div>
          {inProgress && !test.result && (
            // The badge says the numbers; the bar is for the eye, so it is not read out.
            <Progress aria-hidden="true" value={(answered / test.questionCount) * 100} className="mt-1 max-w-48" />
          )}
        </div>
      </Link>

      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-auto md:flex-wrap md:items-center md:justify-end">
        {test.result ? (
          <>
            {missed ? (
              <>
                {/* One button for both retakes. Not modal, so the dialog can open as the menu closes. */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="md:order-2">
                      <Trans>Take it again</Trans>
                      <ChevronDown aria-hidden="true" className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => ask(false)}>
                      <Trans>All questions</Trans>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => ask(true)}>
                      <Trans>Retake wrong ones</Trans>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <RetakeDialog testId={test.id} wrongOnly={wrongOnly} open={asking} onOpenChange={setAsking} />
              </>
            ) : (
              <RetakeButton testId={test.id} variant="outline" className={cn("md:order-2", test.review.length === 0 && "col-span-2")}>
                <Trans>Take it again</Trans>
              </RetakeButton>
            )}
            {test.review.length > 0 && (
              <Button variant="outline" aria-expanded={open} onClick={() => setOpen(!open)} className="md:order-1 md:px-3.5">
                <Trans>Review ({reviewCount})</Trans>
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")}
                />
              </Button>
            )}
          </>
        ) : (
          <Button asChild variant={inProgress ? "outline" : "default"} className="col-span-2 md:px-4.5">
            <Link to={quizHref} prefetch="intent">
              {inProgress ? t`Continue` : t`Start the test`}
            </Link>
          </Button>
        )}
      </div>

      {open && <GrammarChips testId={test.id} chips={test.review} className="w-full" />}
    </li>
  );
}
