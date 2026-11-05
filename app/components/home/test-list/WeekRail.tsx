import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Link, useNavigation, useSearchParams } from "react-router";
import { TabHighlight } from "~/components/TabHighlight";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
import type { TestSummary } from "~/lib/views";

/**
 * The weeks to pick from, the one shown tinted in ink: a column beside the week on a computer, each with how many of
 * its tests are taken; a carousel of plain pills above it on a phone, a ✓ on a week all taken, which snaps to a pill
 * and keeps the one shown in its middle. On a computer one highlight slides to the week picked, as soon as it is picked.
 * A week is a link that keeps the rest of the address, so the week picked is still there on the way back.
 */
export function WeekRail({ weeks, current }: { weeks: { week: number; tests: TestSummary[] }[]; current: number }) {
  const { t } = useLingui();
  const [params] = useSearchParams();
  const next = Number(new URLSearchParams(useNavigation().location?.search).get("week"));
  const shown = weeks.some(({ week }) => week === next) ? next : current;
  const currentRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const chip = currentRef.current;
    const carousel = chip?.closest("nav");
    // Sideways only, so the page doesn't jump; the column on a computer doesn't scroll sideways, so it is left as it is.
    if (chip && carousel) carousel.scrollLeft = chip.offsetLeft - (carousel.clientWidth - chip.offsetWidth) / 2;
  }, [current]);
  const hrefOf = (week: number) => {
    const next = new URLSearchParams(params);
    next.set("week", String(week));
    return `?${next}`;
  };
  return (
    <nav
      aria-label={t`Weeks`}
      className="relative -mx-4 flex carousel-x snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto scroll-smooth px-4 motion-reduce:scroll-auto md:mx-0 md:mask-none md:block md:w-56 md:shrink-0 md:overflow-visible md:rounded-xl md:border md:bg-card md:p-2"
    >
      {/* A box only on a computer, for the highlight; on a phone the pills sit straight in the carousel. */}
      <div className="contents md:relative md:flex md:flex-col">
        <TabHighlight
          vertical
          index={weeks.findIndex(({ week }) => week === shown)}
          count={weeks.length}
          className="hidden rounded-lg bg-foreground/8 md:block"
        />
        {weeks.map(({ week, tests }) => {
          const taken = tests.filter((test) => test.result).length;
          const isShown = week === shown;
          return (
            <Link
              key={week}
              ref={week === current ? currentRef : undefined}
              to={hrefOf(week)}
              replace
              preventScrollReset
              aria-current={week === current ? "true" : undefined}
              className={cn(
                "flex shrink-0 snap-center items-center gap-1 rounded-full border px-3.5 py-1.5 text-foreground no-underline transition-colors md:flex-col md:items-stretch md:gap-1.5 md:rounded-lg md:border-transparent md:px-3 md:py-2.5",
                isShown
                  ? "border-foreground/35 bg-foreground/8 md:bg-transparent"
                  : "bg-card hover:bg-muted/60 md:bg-transparent",
              )}
            >
              <span className="relative flex items-center justify-between gap-2">
                <span className="font-semibold">
                  <Trans>Week {week}</Trans>
                </span>
                {/* Read out on a phone too, where only the ✓ shows. */}
                <span className="sr-only text-xs text-muted-foreground tabular-nums md:not-sr-only">
                  {taken} / {tests.length}
                </span>
                {taken === tests.length && <Check aria-hidden="true" className="size-3.5 md:hidden" />}
              </span>
              {/* The numbers say it; the bar is for the eye. */}
              <Progress
                aria-hidden="true"
                value={(taken / tests.length) * 100}
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
