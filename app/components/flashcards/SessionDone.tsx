import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Link, useSubmit } from "react-router";
import { SessionSummary } from "~/components/card-session/SessionSummary";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { WordChips } from "~/components/WordChips";
import { cardsOf, homeOf } from "~/lib/links";
import { chapterTitle } from "~/lib/sections";
import type { FlashCard, FlashcardsView } from "~/lib/views";

/**
 * The end of a session: how many cards were got right the first time and how many needed Again, the learned words of
 * the chapter (of the lesson, on one) now, the cards still being learned, and the ways on.
 */
export function SessionDone({
  view,
  total,
  gotIt,
  missed,
  learned,
  onStudyAgain,
}: {
  view: FlashcardsView;
  total: number;
  gotIt: number;
  missed: FlashCard[];
  learned: number;
  onStudyAgain: () => void;
}) {
  const { t } = useLingui();
  const submit = useSubmit();
  const again = missed.length;
  const chapter = view.lesson?.title ?? chapterTitle(view.title);
  // Nothing left to learn: no more new sets, only a review.
  const complete = learned >= view.words;
  const seen = view.cards.map((card) => card.wordId);
  const quizHref = view.quiz && (view.quiz.result ? `/tests/${view.quiz.id}/results` : `/tests/${view.quiz.id}`);
  return (
    <>
      <Card className="flex flex-col gap-3.5 p-4 md:p-6">
        {total > 0 ? (
          <SessionSummary total={total} gotIt={gotIt} again={again} />
        ) : (
          <h2 className="text-xl font-bold tracking-tight">
            <Trans>All words learned</Trans>
          </h2>
        )}
        {complete && total > 0 && (
          <p className="text-body-sm font-semibold text-success">
            <Trans>That was the last set. Every word of {chapter} is learned.</Trans>
          </p>
        )}
        <div className={total > 0 ? "grid grid-cols-2 gap-2" : "hidden"}>
          <div className="flex flex-col gap-0.5 rounded-box border border-success-border bg-success-soft px-3.5 py-2.5 text-success">
            <span className="text-xs">
              <Trans>Got it</Trans>
            </span>
            <span className="text-2xl font-bold">{gotIt}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-box border border-primary-border bg-primary-soft px-3.5 py-2.5 text-primary-soft-foreground">
            <span className="text-xs">
              <Trans>Again</Trans>
            </span>
            <span className="text-2xl font-bold">{again}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3 text-caption">
            <span className="text-subtle-foreground">
              <Trans>Learned in {chapter}</Trans>
            </span>
            <span className="font-semibold">
              {learned} / {view.words}
            </span>
          </div>
          {/* The figures above say it; the bar is for the eye, so it is not read out. */}
          <Progress aria-hidden="true" value={view.words === 0 ? 0 : (learned / view.words) * 100} className="h-2" />
        </div>
      </Card>

      {again > 0 && (
        <Card className="flex flex-col gap-2.5 p-4 md:p-6">
          <h2 className="text-base font-semibold">
            <Trans>Still learning ({again})</Trans>
          </h2>
          <WordChips words={missed} />
          <p className="text-caption text-muted-foreground">
            <Trans>Not learned yet. Study them again now, or they come back after the new cards.</Trans>
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {again > 0 && (
          <Button size="lg" onClick={onStudyAgain} className="font-semibold">
            <Plural value={again} one="Study it again" other="Study the # again" />
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant={again > 0 ? "outline" : "default"} size="lg" className={quizHref ? undefined : "col-span-2"}>
            <Link
              to={
                complete
                  ? cardsOf(view.level, view.chapter, { page: view.lesson?.page, review: true })
                  : cardsOf(view.level, view.chapter, { page: view.lesson?.page, seen })
              }
            >
              {complete ? <Trans>Review again</Trans> : <Trans>Next set</Trans>}
            </Link>
          </Button>
          {quizHref && (
            <Button asChild variant="outline" size="lg">
              <Link to={quizHref}>
                <Trans>Take the quiz</Trans>
              </Link>
            </Button>
          )}
        </div>
        {learned > 0 && (
          <ConfirmDialog
            title={<Trans>Reset progress?</Trans>}
            description={view.lesson ? t`Every word of ${chapter} becomes not learned again.` : t`Every word of ${chapter} becomes not learned again, in every lesson.`}
            confirmLabel={t`Reset`}
            onConfirm={() => submit({ reset: true, ...(view.lesson && { page: view.lesson.page }) }, { method: "post", encType: "application/json" })}
          >
            <Button variant="ghost" size="lg">
              <Trans>Reset progress</Trans>
            </Button>
          </ConfirmDialog>
        )}
        <Button asChild variant="ghost" size="lg">
          <Link to={homeOf({ kind: "kanji", ...view })}>
            <Trans>Back to topics</Trans>
          </Link>
        </Button>
      </div>
    </>
  );
}
