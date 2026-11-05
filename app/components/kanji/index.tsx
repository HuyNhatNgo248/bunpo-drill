import { Trans } from "@lingui/react/macro";
import { EmptyState } from "~/components/EmptyState";
import { useTabLoading } from "~/components/SubjectTabs";
import { cn } from "~/lib/utils";
import { isTestLevel, KANJI_LEVEL } from "~/lib/levels";
import type { KanjiHomeView } from "~/lib/views";
import { ChapterList } from "./chapter-list";
import { Stats } from "./Stats";

/**
 * The kanji page for one level: the figures over its chapters, then each chapter with its flashcards and its quiz. The
 * book's level with no chapters yet says how to send one; any other level without chapters is not available yet.
 */
export function KanjiHome({ home }: { home: KanjiHomeView }) {
  const { level, chapters } = home;
  // Another tab or level is loading: this page fades, so the click shows at once.
  const switching = useTabLoading();
  return (
    <>
      {/* The 漢字 tab says it on screen; the heading stays for screen readers. */}
      <h1 className="sr-only">
        <Trans>Kanji</Trans>
      </h1>

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
          <EmptyState title={<Trans>{level} isn't available yet</Trans>}>
            <Trans>Kanji for {level} is coming later.</Trans>
          </EmptyState>
        )}
      </div>
    </>
  );
}
