import { Outlet, useMatches } from "react-router";
import { LevelTabs } from "~/components/LevelTabs";
import { SubjectTabs } from "~/components/SubjectTabs";
import { JLPT_LEVELS, type JlptLevel } from "~/lib/levels";
import { AppHeader } from "./header";

/** What a page under the tabs says about itself: `levels` when it is shown one JLPT level at a time. */
export type TabsHandle = { levels?: boolean };

/**
 * The frame of the grammar, kanji and notes pages: the header, then the subject tabs and, on a page of levels, the level
 * tabs, on one line over a rule (on a phone the levels go under it). They stay on screen while the page under them
 * changes, so each highlight slides all the way. Each of these pages' loaders gives the `level` that the tabs keep.
 */
export function TabsLayout() {
  const page = useMatches().at(-1);
  const level = (page?.loaderData as { level?: JlptLevel | null } | undefined)?.level ?? null;
  const levels = (page?.handle as TabsHandle | undefined)?.levels;
  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-3 pb-10 md:gap-6 md:px-6 md:pt-6 md:pb-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:border-b">
          {/* The underline of the tab shown sits on the rule. */}
          <SubjectTabs level={level} className="border-b md:-mb-px md:border-b-0" />
          {levels && level && <LevelTabs levels={JLPT_LEVELS} current={level} className="self-start md:mb-2 md:self-auto" />}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
