import { Trans } from "@lingui/react/macro";
import { EmptyState } from "~/components/EmptyState";
import { useTabLoading } from "~/components/SubjectTabs";
import { isTestLevel } from "~/lib/levels";
import { cn } from "~/lib/utils";
import type { ReadingHomeView } from "~/lib/views";
import { GroupList } from "./GroupList";

/**
 * The reading page for one level: its sets one group at a time (a reading type, or 総合), each with its misses and
 * pace. A level with no sets yet says how to make one; a level the app has no tests for is not available yet.
 */
export function ReadingHome({ home }: { home: ReadingHomeView }) {
  const { level, groups } = home;
  // Another tab or level is loading: this page fades, so the click shows at once.
  const switching = useTabLoading();
  return (
    <>
      {/* The Reading tab says it on screen; the heading stays for screen readers. */}
      <h1 className="sr-only">
        <Trans>Reading</Trans>
      </h1>

      <div aria-busy={switching} className={cn("flex flex-col gap-4 transition-opacity duration-200 md:gap-6", switching && "opacity-50")}>
        {groups.some((group) => group.sets.length) ? (
          <GroupList groups={groups} />
        ) : isTestLevel(level) ? (
          <EmptyState title={<Trans>No {level} reading sets yet</Trans>}>
            <Trans>A set shows up here once Claude sends one, with /jlpt-reading-quiz 短文.</Trans>
          </EmptyState>
        ) : (
          <EmptyState title={<Trans>{level} isn't available yet</Trans>}>
            <Trans>Reading for {level} is coming later.</Trans>
          </EmptyState>
        )}
      </div>
    </>
  );
}
