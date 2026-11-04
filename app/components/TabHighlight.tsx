import { cn } from "~/lib/utils";

/**
 * The highlight that slides to the tab shown. Put it first in a positioned box of tabs of one size, so it moves by whole
 * tabs with a CSS transition and is in place before any script runs. Give the tabs' words `relative` so they stay over it.
 */
export function TabHighlight({
  index,
  count,
  vertical = false,
  className,
}: {
  index: number;
  count: number;
  vertical?: boolean;
  className?: string;
}) {
  const size = `${100 / count}%`;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-md bg-primary-soft transition-transform duration-300 ease-out motion-reduce:transition-none",
        vertical ? "inset-x-0 top-0" : "inset-y-0 left-0",
        className,
        index < 0 && "hidden",
      )}
      style={
        vertical
          ? { height: size, transform: `translateY(${index * 100}%)` }
          : { width: size, transform: `translateX(${index * 100}%)` }
      }
    />
  );
}
