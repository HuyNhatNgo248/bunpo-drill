import type { ReactNode } from "react";

/**
 * The square at the start of a list row: the number to scan the list by (a week, a chapter) over what it counts.
 * For the eye only: the row's title, read out, names it.
 */
export function NumberTile({ value, label }: { value: string; label: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary text-secondary-foreground md:size-12"
    >
      <span className="text-base leading-none font-bold tabular-nums">{value}</span>
      <span className="text-2xs leading-none">{label}</span>
    </span>
  );
}
