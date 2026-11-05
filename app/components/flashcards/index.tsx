import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { CardControls } from "~/components/card-session/CardControls";
import { useSession } from "~/components/card-session/hooks/useSession";
import { PageTitle } from "~/components/PageTitle";
import { ProgressCard } from "~/components/ProgressCard";
import { ProgressHeader } from "~/components/ProgressHeader";
import { homeOf } from "~/lib/links";
import { chapterLabel } from "~/lib/sections";
import type { FlashcardsView } from "~/lib/views";
import { CardFace } from "./CardFace";
import { ModeTabs, type CardMode } from "./ModeTabs";
import { SessionDone } from "./SessionDone";

/**
 * A flashcard session on one chapter: one card at a time, flipped by a tap, Show answer, Space or ↑ ↓, then Again (it
 * comes back a few cards later) or Got it; ‹ and › (or ← and →) step through the cards without rating them. The counts
 * and the bar follow the cards done; the end shows how it went and the way on.
 */
export function Flashcards({ view }: { view: FlashcardsView }) {
  const { t, i18n } = useLingui();
  const [mode, setMode] = useState<CardMode>("kanji-reading");
  const session = useSession(view.cards);
  const { current, total, done, percent, position } = session;
  const name = `${chapterLabel(i18n, view.chapter)} ${view.title}`;
  const home = homeOf({ kind: "kanji", level: view.level });
  const modeTabs = <ModeTabs mode={mode} onChange={setMode} />;
  const counts = (
    <Trans>
      {session.firstTry} got it · {session.missed.length} again
    </Trans>
  );
  const { words } = view;
  const left = words - view.learned;

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
        <ProgressCard percent={percent} label={t`Cards done`} aside={current && modeTabs}>
          <Trans>
            Cards done {done} / {total}
          </Trans>
          {current && <span className="font-normal text-muted-foreground"> · {counts}</span>}
        </ProgressCard>
        {/* A session is only a slice of the chapter; say so, or a 150-word chapter looks like 20. */}
        {words > total && (
          <p className="text-caption text-muted-foreground">
            <Trans>
              {total} cards per session · {left} of {words} words in this chapter still to learn
            </Trans>
          </p>
        )}

        {current ? (
          <>
            {/* A phone has no progress card, so the switch and the counts get a row of their own. */}
            <div className="flex flex-wrap items-center justify-between gap-3 md:hidden">
              {modeTabs}
              <span className="text-caption text-muted-foreground">{counts}</span>
            </div>
            <CardFace key={current.wordId} card={current} mode={mode} flipped={session.flipped} onFlip={session.flip} />
            <CardControls session={session} />
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
