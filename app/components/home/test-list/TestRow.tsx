import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "~/lib/utils";
import { ChevronDown, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, Link } from "react-router";
import { GrammarChips } from "~/components/grammar-chips";
import { hasSavedAnswers, savedAnsweredCount } from "~/components/quiz/helpers/savedAnswers";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { TestSummary } from "~/lib/views";
import { weekLabel } from "~/lib/sections";
import { DeleteTest } from "./DeleteTest";

/** One test: its handle to drag, its title and last score, and its buttons. Review opens its grammar chips. */
export function TestRow({ test }: { test: TestSummary }) {
  const { t, i18n } = useLingui();
  const [open, setOpen] = useState(false);
  // A test left before submitting has its answers saved in this browser, so the server cannot know; it is read after hydration.
  const [answered, setAnswered] = useState<number | null>(null);
  useEffect(() => setAnswered(hasSavedAnswers(test.id) ? savedAnsweredCount(test.id) : null), [test.id]);
  const inProgress = answered !== null;
  const sortable = useSortable({ id: test.id, attributes: { roleDescription: t`sortable` } });
  const quizHref = `/tests/${test.id}`;
  const weeks = test.weeks.map((week) => weekLabel(i18n, week)).join(" · ");
  const title = test.title;
  const total = test.questionCount;
  const reviewCount = test.review.length;

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      className={cn(
        "relative isolate flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:p-5 md:last:border-b-0",
        sortable.isDragging && "relative z-10 shadow-float hover:bg-card",
      )}
    >
      {/* Drag by this handle only, so the rest of the row still scrolls, opens the test and works its buttons. */}
      <button
        type="button"
        ref={sortable.setActivatorNodeRef}
        {...sortable.attributes}
        {...sortable.listeners}
        aria-label={t`Reorder “${title}”`}
        className="-my-0.5 -ml-2 flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-faint outline-none hover:text-subtle-foreground focus-visible:ring-3 focus-visible:ring-ring/40 active:cursor-grabbing md:-ml-3 md:h-10"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>

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
          {weeks && <span> · {weeks}</span>}
        </div>
        {inProgress && !test.result && (
          // The badge says the numbers; the bar is for the eye, so it is not read out.
          <div aria-hidden="true" className="mt-1 h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-indigo" style={{ width: `${(answered / test.questionCount) * 100}%` }} />
          </div>
        )}
      </Link>

      <DeleteTest test={test} className="-mt-2 -mr-2 md:hidden" />

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
        <DeleteTest test={test} className="hidden md:order-3 md:inline-flex" outlined />
      </div>

      {open && <GrammarChips testId={test.id} chips={test.review} className="w-full" />}
    </li>
  );
}
