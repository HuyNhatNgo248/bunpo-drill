import { AppHeader } from "~/components/layout/header";
import type { TestSummary } from "~/lib/views";
import { EmptyState } from "./EmptyState";
import { useVisibleTests } from "./hooks/useVisibleTests";
import { Stats, type HomeStats } from "./Stats";
import { TestList } from "./test-list";

/** The home page: the figures over all tests, then the list of tests. */
export function Home({ tests: saved, stats }: { tests: TestSummary[]; stats: HomeStats }) {
  const tests = useVisibleTests(saved);

  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main lang="ja" className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">模擬試験</h1>

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
