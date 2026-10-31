import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { WordChips } from "~/components/WordChips";
import { cardsOf, homeOf } from "~/lib/links";
import { chapterLabel } from "~/lib/sections";
import type { FlashCard, FlashcardsView } from "~/lib/views";

/**
 * The end of a session: how many cards were got right the first time and how many needed Again, the chapter's learned
 * words now, the cards still being learned, and the ways on.
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
  const { i18n } = useLingui();
  const again = missed.length;
  const chapter = chapterLabel(i18n, view.chapter);
  const quizHref = view.quiz && (view.quiz.result ? `/tests/${view.quiz.id}/results` : `/tests/${view.quiz.id}`);
  return (
    <>
      <Card className="flex flex-col gap-3.5 p-4 md:p-6">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-bold tracking-tight">
            <Trans>Session done</Trans>
          </h2>
          <p className="text-caption text-muted-foreground">
            <Plural value={total} one="# card" other="# cards" />
            {" · "}
            <Trans>{gotIt} got it first time</Trans>
            {" · "}
            <Trans>{again} needed again</Trans>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
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
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-indigo" style={{ width: `${view.words === 0 ? 0 : (learned / view.words) * 100}%` }} />
          </div>
        </div>
      </Card>

      {again > 0 && (
        <Card className="flex flex-col gap-2.5 p-4 md:p-6">
          <h2 className="text-base font-semibold">
            <Trans>Still learning ({again})</Trans>
          </h2>
          <WordChips words={missed} />
          <p className="text-caption text-muted-foreground">
            <Trans>These stay unlearned and come first next time.</Trans>
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
          <Button asChild variant="outline" size="lg" className={quizHref ? undefined : "col-span-2"}>
            <Link to={cardsOf(view.level, view.chapter)}>
              <Trans>Next cards</Trans>
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
        <Button asChild variant="ghost" size="lg">
          <Link to={homeOf({ kind: "kanji", level: view.level })}>
            <Trans>Back to chapters</Trans>
          </Link>
        </Button>
      </div>
    </>
  );
}
