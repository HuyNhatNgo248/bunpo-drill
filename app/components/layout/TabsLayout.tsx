import { Outlet, useMatches } from "react-router";
import { LevelSwitch } from "~/components/LevelSwitch";
import { BottomTabs, NotesLink, SubjectTabs } from "~/components/SubjectTabs";
import { JLPT_LEVELS, type JlptLevel } from "~/lib/levels";
import { AppHeader } from "./header";
import { QuoteFooter } from "./QuoteFooter";

/** What a page under the tabs says about itself: `levels` when it is shown one JLPT level at a time. */
export type TabsHandle = { levels?: boolean };

/**
 * The frame of the grammar, kanji, reading and notes pages: the header, then one row that is the same on every tab: the
 * level switch, the three subjects as a segmented control, and the notes at the end. On a phone the subjects and the notes
 * are a tab bar at the foot of the screen. The row stays on screen while the page under it changes, so the subject
 * highlight slides all the way. Each of these pages' loaders gives the `level` that the tabs keep.
 */
export function TabsLayout() {
  const page = useMatches().at(-1);
  const level = (page?.loaderData as { level?: JlptLevel | null } | undefined)?.level ?? null;
  const levels = (page?.handle as TabsHandle | undefined)?.levels;
  return (
    // On a phone the tab bar is fixed to the foot of the screen, so the page leaves room for it.
    <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <AppHeader account />
      <main className="mx-auto flex w-full max-w-260 flex-1 flex-col gap-4 px-4 pt-3 pb-10 md:gap-6 md:px-6 md:pt-6 md:pb-16">
        {/* The same on every tab, so nothing moves: the level (greyed on the notes, which aren't split by level), the
            subjects, and the notes, quiet, at the end. On a phone only the level; the tabs are at the foot. */}
        <div className="flex items-center gap-3">
          {level && <LevelSwitch levels={JLPT_LEVELS} current={level} disabled={!levels} className="md:h-11" />}
          <SubjectTabs level={level} className="hidden md:block" />
          <NotesLink className="ml-auto hidden md:flex" />
        </div>
        <Outlet />
      </main>
      <QuoteFooter />
      <BottomTabs level={level} className="md:hidden" />
    </div>
  );
}
