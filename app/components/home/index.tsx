import { Trans } from "@lingui/react/macro";
import { EmptyState } from "~/components/EmptyState";
import { warmDrawerFigure } from "~/components/helpers/drawerFigure";
import { LevelTabs } from "~/components/LevelTabs";
import { useTabLoading } from "~/components/SubjectTabs";
import { cn } from "~/lib/utils";
import { isTestLevel, JLPT_LEVELS, type JlptLevel } from "~/lib/levels";
import type { TestSummary } from "~/lib/views";
import { SortMenu } from "./SortMenu";
import { Stats, type HomeStats } from "./Stats";
import { TestList } from "./test-list";

type HomeProps = {
  tests: TestSummary[];
  stats: HomeStats;
  level: JlptLevel | null;
  /** The tests come latest week first instead of from week 1. */
  latestFirst: boolean;
};

/**
 * The home page for one level: the figures over its tests, then all of them, grouped. Once there is a test, a tab picks
 * any JLPT level; one the app has no tests for yet says it is not available.
 */
export function Home({ tests, stats, level, latestFirst }: HomeProps) {
  // Another tab, level or order is loading: this page fades, so the click shows at once.
  const switching = useTabLoading();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
          <Trans>Mock tests</Trans>
        </h1>
        {level && <LevelTabs levels={JLPT_LEVELS} current={level} warmOf={warmDrawerFigure} />}
      </div>

      <div aria-busy={switching} className={cn("flex flex-col gap-4 transition-opacity duration-200 md:gap-6", switching && "opacity-50")}>
        {tests.length > 0 ? (
          <>
            <Stats stats={stats} />
            <div className="flex flex-col gap-2">
              {level && <SortMenu level={level} latestFirst={latestFirst} />}
              <TestList tests={tests} />
            </div>
          </>
        ) : level && !isTestLevel(level) ? (
          <EmptyState drawer title={<Trans>{level} isn't available yet</Trans>}>
            <Trans>Mock tests for {level} are coming later.</Trans>
          </EmptyState>
        ) : (
          <EmptyState title={<Trans>No mock tests yet</Trans>}>
            <Trans>New mock tests show up here.</Trans>
          </EmptyState>
        )}
      </div>
    </>
  );
}
