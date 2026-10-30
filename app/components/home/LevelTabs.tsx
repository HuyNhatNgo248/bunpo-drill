import { useLingui } from "@lingui/react/macro";
import { Link, useNavigation } from "react-router";
import { cn } from "~/lib/utils";
import type { Level } from "~/lib/payload";

/**
 * Switches the home page between the levels that have tests. The level is in the URL, so a reload keeps it.
 * One highlight slides to the level picked, as soon as it is picked rather than once its tests have loaded.
 * The tabs share one width, so the highlight moves by whole tabs with a CSS transition.
 */
export function LevelTabs({ levels, current }: { levels: Level[]; current: Level }) {
  const { t } = useLingui();
  const next = new URLSearchParams(useNavigation().location?.search).get("level");
  const shown = levels.find((level) => level === next) ?? current;
  return (
    <nav aria-label={t`Level`} className="rounded-lg border bg-card p-1">
      <div className="relative grid auto-cols-fr grid-flow-col">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-md bg-primary-soft transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${100 / levels.length}%`, transform: `translateX(${levels.indexOf(shown) * 100}%)` }}
        />
        {levels.map((level) => (
          <Link
            key={level}
            to={`?level=${level}`}
            aria-current={level === current ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center justify-center rounded-md px-4 text-sm font-semibold outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40",
              level === shown ? "text-primary-soft-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {level}
          </Link>
        ))}
      </div>
    </nav>
  );
}
