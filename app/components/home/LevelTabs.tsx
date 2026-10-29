import { useLingui } from "@lingui/react/macro";
import { MotionConfig, motion } from "motion/react";
import { Link, useNavigation } from "react-router";
import { cn } from "~/lib/utils";
import type { Level } from "~/lib/payload";

/**
 * Switches the home page between the levels that have tests. The level is in the URL, so a reload keeps it.
 * One highlight slides to the level picked, as soon as it is picked rather than once its tests have loaded.
 */
export function LevelTabs({ levels, current }: { levels: Level[]; current: Level }) {
  const { t } = useLingui();
  const next = new URLSearchParams(useNavigation().location?.search).get("level");
  const shown = levels.find((level) => level === next) ?? current;
  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label={t`Level`} className="flex gap-1 rounded-lg border bg-card p-1">
        {levels.map((level) => (
          <Link
            key={level}
            to={`?level=${level}`}
            aria-current={level === current ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center rounded-md px-4 text-sm font-semibold outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/40",
              level === shown ? "text-primary-soft-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {level === shown && (
              <motion.span
                layoutId="level-highlight"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-md bg-primary-soft"
              />
            )}
            <span className="relative">{level}</span>
          </Link>
        ))}
      </nav>
    </MotionConfig>
  );
}
