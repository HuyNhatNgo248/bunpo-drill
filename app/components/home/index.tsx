import { Trans } from "@lingui/react/macro";
import { AppHeader } from "~/components/layout/header";
import { isTestLevel, JLPT_LEVELS, type JlptLevel } from "~/lib/payload";
import type { TestSummary } from "~/lib/views";
import { EmptyState } from "./EmptyState";
import { useVisibleTests } from "./hooks/useVisibleTests";
import { LevelTabs } from "./LevelTabs";
import { LevelUnavailable } from "./LevelUnavailable";
import { PageLinks } from "./PageLinks";
import { Stats, type HomeStats } from "./Stats";
import { TestList } from "./test-list";

type HomeProps = { tests: TestSummary[]; stats: HomeStats; level: JlptLevel | null; page: number; pages: number };

/**
 * The home page for one level: the figures over its tests, then a page of the list. Once there is a test, a tab picks
 * any JLPT level; one the app has no tests for yet says it is not available.
 */
export function Home({ tests: saved, stats, level, page, pages }: HomeProps) {
  const tests = useVisibleTests(saved);

  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
            <Trans>Mock tests</Trans>
          </h1>
          {level && <LevelTabs levels={JLPT_LEVELS} current={level} />}
        </div>

        {tests.length > 0 ? (
          <>
            <Stats stats={stats} />
            <TestList tests={tests} />
            {level && <PageLinks level={level} page={page} pages={pages} />}
          </>
        ) : level && !isTestLevel(level) ? (
          <LevelUnavailable level={level} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
