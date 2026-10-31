import { Trans } from "@lingui/react/macro";
import { AppHeader } from "~/components/layout/header";
import { LevelTabs } from "~/components/LevelTabs";
import { SubjectTabs } from "~/components/SubjectTabs";
import { Card } from "~/components/ui/card";
import { isTestLevel, JLPT_LEVELS } from "~/lib/payload";
import type { KanjiHomeView } from "~/lib/views";
import { ChapterList } from "./chapter-list";
import { Stats } from "./Stats";

/** The kanji page for one level: the figures over its chapters, then each chapter with its flashcards and its quiz. */
export function KanjiHome({ home }: { home: KanjiHomeView }) {
  const { level, chapters } = home;
  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <SubjectTabs current="kanji" level={level} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
            <Trans>Kanji</Trans>
          </h1>
          <LevelTabs levels={JLPT_LEVELS} current={level} />
        </div>

        {chapters.length > 0 && isTestLevel(level) ? (
          <>
            <Stats stats={home.stats} />
            <ChapterList level={level} chapters={chapters} />
          </>
        ) : (
          <Card className="flex flex-col items-center gap-2 border-dashed border-input p-7 text-center">
            <h2 className="text-base font-semibold">
              <Trans>No {level} chapters yet</Trans>
            </h2>
            <p className="max-w-115 text-muted-foreground">
              <Trans>A chapter shows up here once Claude sends its words, with /jlpt-kanji-quiz 1章.</Trans>
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
