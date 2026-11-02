import { Outlet, useMatches } from "react-router";
import { SubjectTabs } from "~/components/SubjectTabs";
import type { JlptLevel } from "~/lib/levels";
import { AppHeader } from "./header";

/**
 * The frame of the grammar, kanji and notes pages: the header and the tabs between them, which stay on screen while
 * the page under them changes, so the tab highlight slides all the way. Each of these pages' loaders gives the `level`
 * that the tabs keep.
 */
export function TabsLayout() {
  const page = useMatches().at(-1)?.loaderData as { level?: JlptLevel | null } | undefined;
  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <SubjectTabs level={page?.level ?? null} />
        <Outlet />
      </main>
    </div>
  );
}
