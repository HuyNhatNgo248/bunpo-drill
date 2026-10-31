import { useLingui } from "@lingui/react/macro";
import { Link, useNavigation } from "react-router";
import { cn } from "~/lib/utils";
import type { JlptLevel } from "~/lib/payload";

/**
 * Switches a page (the mock tests, or kanji) between the JLPT levels. The level is in the URL, so a reload keeps it.
 * One highlight slides to the level picked, as soon as it is picked rather than once its tests have loaded.
 * The tabs share one width, so the highlight moves by whole tabs with a CSS transition.
 * `warmOf` gives a level's tab what to start loading on hover, focus or press, not once its page shows.
 */
export function LevelTabs({
  levels,
  current,
  warmOf,
}: {
  levels: readonly JlptLevel[];
  current: JlptLevel;
  warmOf?: (level: JlptLevel) => (() => void) | undefined;
}) {
  const { t } = useLingui();
  const next = new URLSearchParams(useNavigation().location?.search).get("level");
  const shown = levels.find((level) => level === next) ?? current;
  return (
    // A phone's row is too narrow for the title and five tabs, so the tabs wrap under it and fill the width.
    <nav aria-label={t`Level`} className="w-full rounded-lg border bg-card p-1 md:w-auto">
      <div className="relative grid auto-cols-fr grid-flow-col">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-md bg-primary-soft transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${100 / levels.length}%`, transform: `translateX(${levels.indexOf(shown) * 100}%)` }}
        />
        {levels.map((level) => {
          const warm = warmOf?.(level);
          return (
            <Link
              key={level}
              to={`?level=${level}`}
              onPointerEnter={warm}
              onPointerDown={warm}
              onFocus={warm}
              aria-current={level === current ? "page" : undefined}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40",
                level === shown ? "text-primary-soft-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {level}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
