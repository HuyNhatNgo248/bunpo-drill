import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Form, Link } from "react-router";
import { GrammarChips } from "~/components/grammar-chips";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import type { TestSummary } from "~/lib/views";

/**
 * One test: its title and last score, and its buttons. Review opens its grammar chips.
 * `answered`: how many questions it has answers saved for, when it was left before submitting.
 */
export function TestRow({ test, answered }: { test: TestSummary; answered: number | null }) {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const inProgress = answered !== null;
  const quizHref = `/tests/${test.id}`;
  const total = test.questionCount;
  const reviewCount = test.review.length;
  const lastScore = test.previous && `${test.previous.score} / ${test.previous.total}`;

  return (
    <li className="relative isolate flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:p-5 md:last:border-b-0">

      {/* Its ::after fills the row under the buttons, so the whole row opens the test but the buttons still work. */}
      <Link
        to={test.result ? `${quizHref}/results` : quizHref}
        className="flex min-w-0 flex-1 flex-col gap-1 text-foreground no-underline after:absolute after:inset-0 after:-z-10 md:flex-row-title md:gap-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft" className="text-2xs md:text-xs">
            {test.level}
          </Badge>
          <span className="text-base font-semibold">{test.title}</span>
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
      </Link>

      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-auto md:flex-wrap md:items-center md:justify-end">
        {test.result ? (
          <>
            {/* Retake clears the last result and review chips on the server, then opens the quiz. */}
            <Form method="post" action={`${quizHref}/retake`} className="contents">
              <Button type="submit" variant="outline" className={cn("md:order-2", test.review.length === 0 && "col-span-2")}>
                <Trans>Take it again</Trans>
              </Button>
            </Form>
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
          <Button asChild className="col-span-2 md:px-4.5">
            <Link to={quizHref}>{inProgress ? t`Continue` : t`Start the test`}</Link>
          </Button>
        )}
      </div>

      {open && <GrammarChips testId={test.id} chips={test.review} className="w-full" />}
    </li>
  );
}
