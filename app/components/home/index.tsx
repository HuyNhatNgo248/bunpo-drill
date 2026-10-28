import { Trans } from "@lingui/react/macro";
import { AppHeader } from "~/components/layout/header";
import type { Level } from "~/lib/payload";
import type { TestSummary } from "~/lib/views";
import { EmptyState } from "./EmptyState";
import { useVisibleTests } from "./hooks/useVisibleTests";
import { LevelTabs } from "./LevelTabs";
import { Stats, type HomeStats } from "./Stats";
import { TestList } from "./test-list";

type HomeProps = { tests: TestSummary[]; stats: HomeStats; level: Level | null; levels: Level[] };

/** The home page for one level: the figures over its tests, then the list. A switch picks the level when both have tests. */
export function Home({ tests: saved, stats, level, levels }: HomeProps) {
  const tests = useVisibleTests(saved);

  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
            <Trans>Mock tests</Trans>
          </h1>
          {level && levels.length > 1 && <LevelTabs levels={levels} current={level} />}
        </div>

        {tests.length > 0 ? (
          <>
            <Stats stats={stats} total={tests.length} />
            <TestList tests={tests} />
          </>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
