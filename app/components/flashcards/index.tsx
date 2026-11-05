import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { CardControls } from "~/components/card-session/CardControls";
import { useSession } from "~/components/card-session/hooks/useSession";
import { PageTitle } from "~/components/PageTitle";
import { ProgressCard } from "~/components/ProgressCard";
import { ProgressHeader } from "~/components/ProgressHeader";
import { homeOf } from "~/lib/links";
import { chapterTitle } from "~/lib/sections";
import type { FlashcardsView } from "~/lib/views";
import { CardFace } from "./CardFace";
import { ModeTabs, saveMode, savedMode, type CardMode } from "./ModeTabs";
import { SessionDone } from "./SessionDone";

/**
 * A flashcard session on one chapter, or one lesson of it: one card at a time, flipped by a tap, Show answer, Space or ↑ ↓, then Again (it
 * comes back a few cards later) or Got it; ‹ and › (or ← and →) step through the cards without rating them. The counts
 * and the bar follow the cards done; the end shows how it went and the way on.
 */
export function Flashcards({ view }: { view: FlashcardsView }) {
  const { t } = useLingui();
  const [mode, setMode] = useState<CardMode>("kanji-reading");
  // The side picked last time, read after mount so the server and the first paint agree.
  useEffect(() => setMode(savedMode()), []);
  const session = useSession(view.cards);
  const { current, total, done, percent, count } = session;
  const name = view.lesson?.title ?? chapterTitle(view.title);
  const home = homeOf({ kind: "kanji", ...view });
  const modeTabs = (
    <ModeTabs
      mode={mode}
      onChange={(next) => {
        setMode(next);
        saveMode(next);
      }}
    />
  );
  const counts = session.toRepeat > 0 && <Trans>{session.toRepeat} to repeat</Trans>;
  const { words } = view;
  const left = words - view.learned;
  // Sets of new words still to go, this one included: it only goes down, as words are learned.
  const sets = Math.ceil(left / view.size);
  const togo = <Plural value={sets} one="the last set" other="# sets to go" />;

  return (
    <div className="min-h-screen">
      <ProgressHeader
        title={`${name} · ${t`Flashcards`}`}
        count={total > 0 ? count : ""}
        percent={percent}
        label={t`Cards done`}
        back={{ to: home, label: t`Back to lessons` }}
      />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16">
        <PageTitle level={view.level} meta={view.lesson && <span lang="ja" className="font-jp">{chapterTitle(view.title)}</span>} back={{ to: home, label: <Trans>← Lessons</Trans> }}>
          <span lang="ja" className="font-jp">
            {name}
          </span>{" "}
          · <Trans>Flashcards</Trans>
        </PageTitle>
        {total > 0 && (
          <ProgressCard percent={percent} label={t`Cards done`} aside={current && modeTabs}>
            <Trans>
              Cards done {done} / {total}
            </Trans>
            {current && counts && <span className="font-normal text-muted-foreground"> · {counts}</span>}
          </ProgressCard>
        )}
        {/* A session is only a slice of the chapter; say which, or a 150-word chapter looks like 20. */}
        {current && view.source === "new" && words > view.size && (
          <p className="text-caption text-muted-foreground">
            {view.lesson ? (
              <Trans>
                {left} of {words} words in this lesson still to learn · {togo}
              </Trans>
            ) : (
              <Trans>
                {left} of {words} words in this chapter still to learn · {togo}
              </Trans>
            )}
          </p>
        )}

        {current ? (
          <>
            {/* A phone has no progress card, so the switch and the counts get a row of their own. */}
            <div className="flex flex-wrap items-center justify-between gap-3 md:hidden">
              {modeTabs}
              <span className="text-caption text-muted-foreground">{counts}</span>
            </div>
            <CardFace key={current.wordId} card={current} mode={mode} flipped={session.flipped} onFlip={session.flip} showLesson={!view.lesson} />
            <CardControls session={session} />
          </>
        ) : (
          <SessionDone
            view={view}
            total={total}
            gotIt={session.firstTry}
            missed={session.missed}
            learned={view.learned + session.learnedChange}
            onStudyAgain={session.studyAgain}
          />
        )}
      </main>
    </div>
  );
}
