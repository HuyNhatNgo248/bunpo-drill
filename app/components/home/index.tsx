import { Trans } from "@lingui/react/macro";
import { useEffect } from "react";
import { EmptyState } from "~/components/EmptyState";
import { warmDrawerFigure } from "~/components/helpers/drawerFigure";
import { AppHeader } from "~/components/layout/header";
import { LevelTabs } from "~/components/LevelTabs";
import { SubjectTabs } from "~/components/SubjectTabs";
import { rememberTab } from "~/lib/lastTab";
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
  // The app opens here again next time, after a sign-in too.
  useEffect(() => {
    if (level) rememberTab({ subject: "grammar", level });
  }, [level]);

  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <SubjectTabs current="grammar" level={level} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
            <Trans>Mock tests</Trans>
          </h1>
          {level && <LevelTabs levels={JLPT_LEVELS} current={level} warmOf={warmDrawerFigure} />}
        </div>

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
      </main>
    </div>
  );
}
