import { Trans, useLingui } from "@lingui/react/macro";
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { PageTitle } from "~/components/PageTitle";
import { ProgressCard } from "~/components/ProgressCard";
import { ProgressHeader } from "~/components/ProgressHeader";
import { Button } from "~/components/ui/button";
import { homeOf } from "~/lib/links";
import { chapterLabel } from "~/lib/sections";
import type { FlashcardsView } from "~/lib/views";
import { CardFace } from "./CardFace";
import { useSession } from "./hooks/useSession";
import { ModeTabs, type CardMode } from "./ModeTabs";
import { SessionDone } from "./SessionDone";

/**
 * A flashcard session on one chapter: one card at a time, flipped by a tap or Show answer, then Again (it comes back a
 * few cards later) or Got it; ‹ and › (or the ← and → keys) step through the cards without rating them. The counts and
 * the bar follow the cards done; the end shows how it went and the way on.
 */
export function Flashcards({ view }: { view: FlashcardsView }) {
  const { t, i18n } = useLingui();
  const [mode, setMode] = useState<CardMode>("kanji-reading");
  const session = useSession(view.cards);
  const { current, total, done } = session;
  const name = `${chapterLabel(i18n, view.chapter)} ${view.title}`;
  const home = homeOf({ kind: "kanji", level: view.level });
  const percent = total === 0 ? 100 : (done / total) * 100;
  const position = `${Math.min(session.position, total)} / ${total}`;
  const { prev, next } = session;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // With a modifier, the arrows are the browser's (Alt+← goes back a page).
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowLeft") prev?.();
      if (event.key === "ArrowRight") next?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prev, next]);

  return (
    <div className="min-h-screen">
      <ProgressHeader
        title={`${name} · ${t`Flashcards`}`}
        count={position}
        percent={percent}
        label={t`Cards done`}
        back={{ to: home, label: t`Back to kanji` }}
      />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16">
        <PageTitle level={view.level} meta={position} back={{ to: home, label: <Trans>← Kanji</Trans> }}>
          <span lang="ja" className="font-jp">
            {name}
          </span>{" "}
          · <Trans>Flashcards</Trans>
        </PageTitle>
        <ProgressCard percent={percent} label={t`Cards done`}>
          <Trans>
            Cards done {done} / {total}
          </Trans>
        </ProgressCard>

        {current ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ModeTabs mode={mode} onChange={setMode} />
              <span className="text-caption text-muted-foreground">
                <Trans>
                  {session.firstTry} got it · {session.missed.length} again
                </Trans>
              </span>
            </div>
            <CardFace key={current.wordId} card={current} mode={mode} flipped={session.flipped} onFlip={session.flip} />
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="lg" onClick={session.prev} disabled={!session.prev} aria-label={t`Previous card`} className="aspect-square px-0">
                <ChevronLeft aria-hidden="true" />
              </Button>
              {session.flipped ? (
                <div className="grid flex-1 grid-cols-2 gap-2 md:flex-none">
                  <Button variant="outline" size="lg" onClick={session.again} className="font-semibold">
                    <RotateCcw aria-hidden="true" />
                    <Trans>Again</Trans>
                  </Button>
                  <Button size="lg" onClick={session.gotIt} className="font-semibold">
                    <Check aria-hidden="true" />
                    <Trans>Got it</Trans>
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={session.flip} className="flex-1 font-semibold md:flex-none md:px-8">
                  <Trans>Show answer</Trans>
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={session.next} disabled={!session.next} aria-label={t`Next card`} className="aspect-square px-0">
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </>
        ) : (
          <SessionDone
            view={view}
            total={total}
            gotIt={session.firstTry}
            missed={session.missed}
            learned={view.learned + session.newlyLearned}
            onStudyAgain={session.studyAgain}
          />
        )}
      </main>
    </div>
  );
}
