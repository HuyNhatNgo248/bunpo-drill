import { Trans } from "@lingui/react/macro";
import { EmptyState } from "~/components/EmptyState";
import { useTabLoading } from "~/components/SubjectTabs";
import { cn } from "~/lib/utils";
import type { ReadingHomeView } from "~/lib/views";
import { GroupList } from "./GroupList";

/**
 * The reading page for one level: its sets one group at a time (a reading type, or 総合), each with its misses and
 * pace. Every level can have sets; a level with none yet says how to make one. The admin
 * renames or deletes a set from the menu of a right click on it.
 */
export function ReadingHome({ home, isAdmin = false }: { home: ReadingHomeView; isAdmin?: boolean }) {
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
          <GroupList groups={groups} isAdmin={isAdmin} />
        ) : (
          <EmptyState title={<Trans>No {level} reading sets yet</Trans>}>
            <Trans>A set shows up here once Claude sends one, with /jlpt-reading-quiz {level} 短文.</Trans>
          </EmptyState>
        )}
      </div>
    </>
  );
}
