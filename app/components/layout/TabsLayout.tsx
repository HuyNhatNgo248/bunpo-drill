import { useEffect } from "react";
import { Outlet, useMatches } from "react-router";
import { LevelSwitch } from "~/components/LevelSwitch";
import { BottomTabs, SubjectTabs } from "~/components/SubjectTabs";
import { tabValue } from "~/lib/lastTab";
import { JLPT_LEVELS, type JlptLevel } from "~/lib/levels";
import { AppHeader } from "./header";
import { QuoteFooter } from "./QuoteFooter";
import { PATHS, usePrefetchTabs } from "./tabCache";

/**
 * The frame of the grammar, kanji and reading pages: the header, then one row that is the same on every tab: the level
 * switch and the three subjects as a segmented control. On a phone the subjects are a tab bar at the foot of the screen. The row stays on screen while the page under it changes, so the subject
 * highlight slides all the way. Each of these pages' loaders gives the `level` that the tabs keep.
 */
export function TabsLayout() {
  const page = useMatches().at(-1);
  const level = (page?.loaderData as { level?: JlptLevel | null } | undefined)?.level ?? null;
  const subject = (["grammar", "kanji", "reading"] as const).find((key) => PATHS[key] === page?.pathname);
  useEffect(() => {
    // Saved from the page shown, not its loader, so a tab link's prefetch saves nothing. A missed save only costs the next visit its tab.
    if (subject && level) fetch("/last-tab", { method: "POST", body: tabValue({ subject, level }) }).catch(() => {});
  }, [subject, level]);
  usePrefetchTabs(level);
  return (
    // On a phone the tab bar is fixed to the foot of the screen, so the page leaves room for it.
    <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <AppHeader account />
      <main className="mx-auto flex w-full max-w-260 flex-1 flex-col gap-4 px-4 pt-3 pb-10 md:gap-6 md:px-6 md:pt-8 md:pb-16">
        {/* The same on every tab, so nothing moves: the level and the subjects, in the middle of the page. On a phone only
            the level; the tabs are at the foot. A little more room under it than between the page's own parts, so it reads
            as the frame's, not the page's. */}
        <div className="flex items-center gap-3 md:mb-2 md:justify-center">
          {/* On a computer one sunken box: the level, quiet, a line, then the subjects. */}
          <div className="flex items-center gap-1 md:rounded-xl md:border md:bg-muted md:p-1">
            {level && (
              <>
                <LevelSwitch
                  levels={JLPT_LEVELS}
                  current={level}
                  className="md:h-8.5 md:border-transparent md:bg-transparent md:hover:bg-card"
                />
                <span aria-hidden="true" className="hidden h-5 w-px bg-input md:block" />
              </>
            )}
            <SubjectTabs level={level} className="hidden md:block" />
          </div>
        </div>
        <Outlet />
      </main>
      <QuoteFooter />
      <BottomTabs level={level} className="md:hidden" />
    </div>
  );
}
