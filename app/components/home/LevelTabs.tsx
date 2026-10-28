import { Link } from "react-router";
import type { Level } from "~/lib/payload";

/** Switches the home page between the levels that have tests. The level is in the URL, so a reload keeps it. */
export function LevelTabs({ levels, current }: { levels: Level[]; current: Level }) {
  return (
    <nav aria-label="レベル" className="flex gap-1 rounded-lg border bg-card p-1">
      {levels.map((level) => (
        <Link
          key={level}
          to={`?level=${level}`}
          aria-current={level === current ? "page" : undefined}
          className="flex h-9 items-center rounded-md px-4 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-soft-foreground"
        >
          {level}
        </Link>
      ))}
    </nav>
  );
}
