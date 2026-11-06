import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Link, useNavigation, useSearchParams } from "react-router";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

/** One thing to pick: its number in the address, what it says, and how much of it is done. */
export type RailItem = { value: number; label: React.ReactNode; done: number; total: number };

/**
 * The weeks or chapters to pick from, the one shown tinted in ink: a column beside it on a computer, each with how much
 * of it is done; a carousel of plain pills above it on a phone, a ✓ on one all done, which snaps to a pill and keeps
 * the one shown in its middle. Each is a
 * link that sets `param` and keeps the rest of the address, so the one picked is still there on the way back. The page
 * stays where it is, so the one picked stays in view.
 */
export function Rail({
  label,
  param,
  items,
  current,
  numbered = false,
}: {
  label: string;
  param: string;
  items: RailItem[];
  current: number;
  /** Each with its number before it, on a computer, for a label that doesn't say it (a theme, a topic). */
  numbered?: boolean;
}) {
  const [params] = useSearchParams();
  const next = Number(new URLSearchParams(useNavigation().location?.search).get(param));
  const shown = items.some(({ value }) => value === next) ? next : current;
  const currentRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const chip = currentRef.current;
    const carousel = chip?.closest("nav");
    // Sideways only, so the page doesn't jump; the column on a computer doesn't scroll sideways, so it is left as it is.
    if (chip && carousel) carousel.scrollLeft = chip.offsetLeft - (carousel.clientWidth - chip.offsetWidth) / 2;
  }, [current]);
  const hrefOf = (value: number) => {
    const next = new URLSearchParams(params);
    next.set(param, String(value));
    return `?${next}`;
  };
  return (
    <nav
      aria-label={label}
      className="relative -mx-4 flex carousel-x snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto scroll-smooth px-4 motion-reduce:scroll-auto md:mx-0 md:mask-none md:block md:w-56 md:shrink-0 md:overflow-visible md:rounded-xl md:border md:bg-card md:p-2"
    >
      {/* A column only on a computer; on a phone the pills sit straight in the carousel. */}
      <div className="contents md:flex md:flex-col">
        {items.map(({ value, label, done, total }) => {
          const isShown = value === shown;
          return (
            <Link
              key={value}
              ref={value === current ? currentRef : undefined}
              to={hrefOf(value)}
              replace
              preventScrollReset
              aria-current={value === current ? "true" : undefined}
              // The one shown again would load the page again, for nothing.
              onClick={(event) => value === current && event.preventDefault()}
              className={cn(
                "flex shrink-0 snap-center items-center gap-1 rounded-full border px-3.5 py-1.5 text-foreground no-underline transition-colors md:flex-col md:items-stretch md:gap-1.5 md:rounded-lg md:border-transparent md:px-3 md:py-2.5",
                isShown
                  ? "border-foreground/35 bg-foreground/8"
                  : "bg-card hover:bg-muted/60 md:bg-transparent",
              )}
            >
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  {/* Its order, on a computer; a pill on a phone is short as it is. */}
                  {numbered && (
                    <span
                      className={cn(
                        "hidden size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums md:flex",
                        isShown ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {value}
                    </span>
                  )}
                  <span className="truncate font-semibold">{label}</span>
                </span>
                {/* Read out on a phone too, where only the ✓ shows. */}
                <span className="sr-only shrink-0 text-xs text-muted-foreground tabular-nums md:not-sr-only">
                  {done} / {total}
                </span>
                {done === total && <Check aria-hidden="true" className="size-3.5 md:hidden" />}
              </span>
              {/* The numbers say it; the bar is for the eye. */}
              <Progress
                aria-hidden="true"
                value={total === 0 ? 0 : (done / total) * 100}
                className={cn(
                  "hidden md:flex",
                  isShown ? "bg-foreground/10 *:bg-subtle-foreground" : "*:bg-faint",
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
