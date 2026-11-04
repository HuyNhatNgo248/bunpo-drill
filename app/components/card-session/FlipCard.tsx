import { useLingui } from "@lingui/react/macro";
import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

/**
 * The card on the table: `front` face up, `back` once it is flipped; a tap turns it over, and back. `className` goes on
 * both sides.
 *
 * Both sides are one height, whatever is on them, so neither a flip nor the next card moves the buttons under it; a long
 * back scrolls inside the card.
 */
export function FlipCard({
  flipped,
  onFlip,
  front,
  back,
  className,
}: {
  flipped: boolean;
  onFlip: () => void;
  front: ReactNode;
  back: ReactNode;
  className?: string;
}) {
  const { t } = useLingui();

  if (!flipped) {
    return (
      <button
        type="button"
        onClick={onFlip}
        className={cn(
          "flex h-112 flex-col rounded-xl border bg-card p-4 text-left shadow-raised outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:h-120 md:p-6",
          className,
        )}
      >
        {front}
      </button>
    );
  }

  return (
    // A tap anywhere on the back turns the card face up again, and still lets a long back scroll.
    <Card
      aria-label={t`Answer`}
      onClick={onFlip}
      className={cn("relative flex h-112 cursor-pointer flex-col gap-4 overflow-y-auto p-4 shadow-raised md:h-120 md:p-6", className)}
    >
      {back}
      {/* For the keyboard and screen readers; its click reaches the card's. Shown only when it has focus. */}
      <button
        type="button"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:right-3 focus-visible:rounded-md focus-visible:bg-card focus-visible:px-2 focus-visible:py-1 focus-visible:text-caption focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {t`Show the question`}
      </button>
    </Card>
  );
}
