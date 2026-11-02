import { Trans } from "@lingui/react/macro";
import { useNavigation } from "react-router";
import { EmptyState } from "~/components/EmptyState";
import { loadDrawerFigure } from "~/components/helpers/drawerFigure";
import { AppHeader } from "~/components/layout/header";
import { LevelTabs } from "~/components/LevelTabs";
import { SubjectTabs } from "~/components/SubjectTabs";
import { cn } from "~/lib/utils";
import { isTestLevel, JLPT_LEVELS, KANJI_LEVEL, type JlptLevel } from "~/lib/levels";
import type { KanjiHomeView } from "~/lib/views";
import { ChapterList } from "./chapter-list";
import { Stats } from "./Stats";

/** A tab starts loading the drawer figure for a level that will show it: one with no chapters, other than the book's. */
const warmOf = (level: JlptLevel) => (level === KANJI_LEVEL ? undefined : () => void loadDrawerFigure());

/**
 * The kanji page for one level: the figures over its chapters, then each chapter with its flashcards and its quiz. The
 * book's level with no chapters yet says how to send one; any other level without chapters is not available yet.
 */
export function KanjiHome({ home }: { home: KanjiHomeView }) {
  const { level, chapters } = home;
  // Another level of this page is loading: the old one fades, so the click shows at once.
  const navigation = useNavigation();
  const switching = navigation.state === "loading" && navigation.location.pathname === "/kanji";
  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <SubjectTabs current="kanji" level={level} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
            <Trans>Kanji</Trans>
          </h1>
          <LevelTabs levels={JLPT_LEVELS} current={level} warmOf={warmOf} />
        </div>

        <div aria-busy={switching} className={cn("flex flex-col gap-4 transition-opacity duration-200 md:gap-6", switching && "opacity-50")}>
          {chapters.length > 0 && isTestLevel(level) ? (
            <>
              <Stats stats={home.stats} />
              <ChapterList level={level} chapters={chapters} />
            </>
          ) : level === KANJI_LEVEL ? (
            <EmptyState title={<Trans>No {level} chapters yet</Trans>}>
              <Trans>A chapter shows up here once Claude sends its words, with /jlpt-kanji-quiz 1章.</Trans>
            </EmptyState>
          ) : (
            <EmptyState drawer title={<Trans>{level} isn't available yet</Trans>}>
              <Trans>Kanji for {level} is coming later.</Trans>
            </EmptyState>
          )}
        </div>
      </main>
    </div>
  );
}
