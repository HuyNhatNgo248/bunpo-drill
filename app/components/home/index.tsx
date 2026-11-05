import { Trans } from "@lingui/react/macro";
import { EmptyState } from "~/components/EmptyState";
import { useTabLoading } from "~/components/SubjectTabs";
import { cn } from "~/lib/utils";
import { isTestLevel, type JlptLevel } from "~/lib/levels";
import type { TestSummary } from "~/lib/views";
import { TestList } from "./test-list";

type HomeProps = {
  tests: TestSummary[];
  level: JlptLevel | null;
  /** The admin (the owner account) can rename and delete each test. */
  isAdmin?: boolean;
};

/**
 * The home page for one level: the figures over its tests, then its tests one week at a time. Once there is a test, a
 * tab picks any JLPT level; one the app has no tests for yet says it is not available.
 */
export function Home({ tests, level, isAdmin = false }: HomeProps) {
  // Another tab or level is loading: this page fades, so the click shows at once.
  const switching = useTabLoading();
  return (
    <>
      {/* The 文法 tab says it on screen; the heading stays for screen readers. */}
      <h1 className="sr-only">
        <Trans>Mock tests</Trans>
      </h1>

      <div aria-busy={switching} className={cn("flex flex-col gap-4 transition-opacity duration-200 md:gap-6", switching && "opacity-50")}>
        {tests.length > 0 ? (
          <TestList tests={tests} isAdmin={isAdmin} />
        ) : level && !isTestLevel(level) ? (
          <EmptyState title={<Trans>{level} isn't available yet</Trans>}>
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
