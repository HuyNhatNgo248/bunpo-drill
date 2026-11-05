import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Link, useSubmit } from "react-router";
import { SessionSummary } from "~/components/card-session/SessionSummary";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { WordChips } from "~/components/WordChips";
import { cardsOf, homeOf } from "~/lib/links";
import { chapterTitle } from "~/lib/sections";
import { cn } from "~/lib/utils";
import type { FlashCard, FlashcardsView } from "~/lib/views";

/**
 * The end of a session: how many cards were got right the first time and how many needed Again, the learned words of
 * the chapter (of the lesson, on one) now, the cards still being learned, and one clear way on: study the missed ones,
 * the next set of new words, the next lesson once this one is learned, or a review. A reset shows only once all is learned.
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
  // Words not learned yet that this session didn't miss: what a next set would bring.
  const fresh = view.words - learned - missed.length;
  const seen = view.cards.map((card) => card.wordId);
  const { level, chapter: number, lesson, nextLesson } = view;
  const quiz = view.quiz && (view.quiz.result ? { to: `/tests/${view.quiz.id}/results`, label: t`Quiz results` } : { to: `/tests/${view.quiz.id}`, label: t`Take the quiz` });

  // The first is the way on, in colour; the rest are outlined.
  const ways = [
    again > 0 && { key: "again", onClick: onStudyAgain, label: <Plural value={again} one="Study it again" other="Study the # again" /> },
    !complete && fresh > 0 && { key: "next", to: cardsOf(level, number, { page: lesson?.page, seen }), label: <Trans>Next set</Trans> },
    complete && nextLesson && {
      key: "lesson",
      to: cardsOf(level, number, { page: nextLesson.page }),
      label: (
        <Trans>
          Next lesson: <span lang="ja" className="font-jp">{nextLesson.title}</span>
        </Trans>
      ),
    },
    complete && { key: "review", to: cardsOf(level, number, { page: lesson?.page, review: true }), label: <Trans>Review again</Trans> },
    quiz && { key: "quiz", to: quiz.to, label: quiz.label },
  ].filter((way) => way !== false && way !== null);

  const [main, ...rest] = ways;
  const button = (way: (typeof ways)[number], variant: "default" | "outline") =>
    "onClick" in way ? (
      <Button key={way.key} variant={variant} size="lg" onClick={way.onClick} className={variant === "default" ? "font-semibold" : undefined}>
        {way.label}
      </Button>
    ) : (
      <Button key={way.key} asChild variant={variant} size="lg" className={variant === "default" ? "font-semibold" : undefined}>
        <Link to={way.to}>{way.label}</Link>
      </Button>
    );

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
        {complete && total > 0 && view.source !== "review" && (
          <p className="text-body-sm font-semibold text-success">
            <Trans>That was the last set. Every word of {chapter} is learned.</Trans>
          </p>
        )}
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
            {view.source === "review" ? (
              <Trans>Back on your list to learn. Study them again now, or they come with your next set.</Trans>
            ) : (
              <Trans>Not learned yet. Study them again now, or they come back after the new cards.</Trans>
            )}
          </p>
        </Card>
      )}

      {/* The way on in colour, full width; the others side by side under it; leaving and resetting quiet, at the bottom. */}
      <div className="flex flex-col gap-2">
        {main && button(main, "default")}
        {rest.length > 0 && (
          <div className={cn("grid gap-2", rest.length > 1 && "sm:grid-cols-2")}>{rest.map((way) => button(way, "outline"))}</div>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={homeOf({ kind: "kanji", ...view })}>
              <ChevronLeft aria-hidden="true" />
              <Trans>Back to lessons</Trans>
            </Link>
          </Button>
          {complete && learned > 0 && (
            <ConfirmDialog
              title={<Trans>Reset progress?</Trans>}
              description={lesson ? t`Every word of ${chapter} becomes not learned again.` : t`Every word of ${chapter} becomes not learned again, in every lesson.`}
              confirmLabel={t`Reset`}
              onConfirm={() => submit({ reset: true, ...(lesson && { page: lesson.page }) }, { method: "post", encType: "application/json" })}
            >
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <RotateCcw aria-hidden="true" />
                <Trans>Reset progress</Trans>
              </Button>
            </ConfirmDialog>
          )}
        </div>
      </div>
    </>
  );
}
