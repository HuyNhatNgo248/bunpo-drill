import { Trans, useLingui } from "@lingui/react/macro";
import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { AppHeader } from "~/components/layout/header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { homeOf } from "~/lib/links";
import { chapterLabel } from "~/lib/sections";
import type { FlashcardsView } from "~/lib/views";
import { CardFace } from "./CardFace";
import { useSession } from "./hooks/useSession";
import { ModeTabs, type CardMode } from "./ModeTabs";
import { SessionDone } from "./SessionDone";

/**
 * A flashcard session on one chapter: one card at a time, flipped by a tap or Show answer, then Again (it comes back a
 * few cards later) or Got it. The counts and the bar follow the cards done; the end shows how it went and the way on.
 */
export function Flashcards({ view }: { view: FlashcardsView }) {
  const { t, i18n } = useLingui();
  const [mode, setMode] = useState<CardMode>("kanji-reading");
  const session = useSession(view.cards);
  const { current, total, done } = session;
  const name = `${chapterLabel(i18n, view.chapter)} ${view.title}`;
  const home = homeOf({ kind: "kanji", level: view.level });
  const percent = total === 0 ? 100 : (done / total) * 100;
  const position = `${Math.min(done + 1, total)} / ${total}`;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 md:static">
        <AppHeader
          mobileTitle={`${name} · ${t`Flashcards`}`}
          mobileAside={<span className="pr-2 text-caption text-subtle-foreground">{position}</span>}
          back={{ to: home, label: t`Back to kanji` }}
        />
        <Progress value={percent} minFill={1} aria-label={t`Cards done`} className="rounded-none md:hidden" />
      </div>

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16">
        <div className="hidden flex-col gap-2 md:flex">
          <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
            <Badge>{view.level}</Badge>
            <span>{position}</span>
            <Link to={home} className="ml-auto text-subtle-foreground no-underline hover:text-foreground">
              <Trans>← Kanji</Trans>
            </Link>
          </div>
          <h1 className="text-title font-bold tracking-tight">
            <span lang="ja" className="font-jp">
              {name}
            </span>{" "}
            · <Trans>Flashcards</Trans>
          </h1>
          <Progress value={percent} minFill={1} aria-label={t`Cards done`} className="h-2" />
        </div>

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
            {session.flipped ? (
              <div className="grid grid-cols-2 gap-2">
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
              <Button size="lg" onClick={session.flip} className="font-semibold">
                <Trans>Show answer</Trans>
              </Button>
            )}
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
