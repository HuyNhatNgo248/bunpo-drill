import { useLingui } from "@lingui/react/macro";
import { BookOpenText, ClipboardCheck, PenLine } from "lucide-react";
import { Link, useLocation, useNavigation } from "react-router";
import { NavTabs } from "~/components/NavTabs";
import { PATHS, tabHref } from "~/components/layout/tabCache";
import type { JlptLevel } from "~/lib/payload";
import { cn } from "~/lib/utils";

/**
 * True while a tab's page loads, another level of the same one included: the page shown fades, so the click shows at
 * once.
 */
export function useTabLoading(): boolean {
  const navigation = useNavigation();
  return navigation.state === "loading" && Object.values(PATHS).some((path) => path === navigation.location.pathname);
}

/**
 * The grammar mock tests, kanji and reading, each linked at `level`, with the one of the page
 * shown (`current`) and the one being opened, else the current one (`shown`).
 */
function useSubjects(level: JlptLevel | null) {
  const { t } = useLingui();
  const tabs = [
    { key: "grammar", path: PATHS.grammar, label: t`Grammar`, Icon: ClipboardCheck },
    { key: "kanji", path: PATHS.kanji, label: t`Kanji`, Icon: PenLine },
    { key: "reading", path: PATHS.reading, label: t`Reading`, Icon: BookOpenText },
  ].map((tab) => ({ ...tab, to: tabHref(tab.path, level) }));
  const here = useLocation().pathname;
  const current = tabs.find((tab) => tab.path === here)?.key;
  const next = useNavigation().location?.pathname;
  const shown = tabs.find((tab) => tab.path === next)?.key ?? current;
  return { tabs, current, shown };
}

/**
 * A computer's switch between the three subjects, as a segmented control, the highlight sliding to the one picked as soon
 * as it is picked.
 */
export function SubjectTabs({ level, className }: { level: JlptLevel | null; className?: string }) {
  const { t } = useLingui();
  const { tabs, current, shown } = useSubjects(level);
  return <NavTabs label={t`Subject`} tabs={tabs} current={current} shown={shown} variant="segment" className={className} />;
}

/** A phone's tab bar at the foot of the screen, under the thumb: the three subjects, each with its icon. */
export function BottomTabs({ level, className }: { level: JlptLevel | null; className?: string }) {
  const { t } = useLingui();
  const { tabs, current, shown } = useSubjects(level);
  return (
    <nav
      aria-label={t`Sections`}
      className={cn("fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)]", className)}
    >
      <div className="mx-auto grid max-w-120 grid-cols-3">
        {tabs.map(({ key, to, label, Icon }) => (
          <Link
            key={key}
            to={to}
            aria-current={key === current ? "page" : undefined}
            onClick={(event) => key === current && event.preventDefault()}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold no-underline outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              key === shown ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-5.5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
