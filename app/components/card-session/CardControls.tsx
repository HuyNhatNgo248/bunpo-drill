import { Trans, useLingui } from "@lingui/react/macro";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Undo2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { useSession } from "./hooks/useSession";

const KEY = "rounded border bg-muted px-1 font-mono text-xs";

/**
 * The buttons under a card: Show answer, or Again and Got it once it is flipped, then ‹ and › and Undo in a row of their
 * own so a slip doesn't skip a card. Space or ↑ ↓ flip it, 1 and 2 are Again and Got it, ← and → step through the cards,
 * U undoes. On a phone the buttons stick to the bottom of the screen, under the thumb, kept short so they don't cover it.
 */
export function CardControls({ session }: { session: ReturnType<typeof useSession> }) {
  const { t } = useLingui();
  const { current, prev, next, flip, undo, notice, saveFailed, flipped } = session;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // With a modifier, the keys are the browser's (Alt+← goes back a page).
      if (!current || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      // Space on a focused button or link presses it, as anywhere else; ↑ and ↓ flip whatever has focus.
      const onControl = event.target instanceof Element && event.target.closest("button, a, input, select, textarea");
      if (event.key === "ArrowLeft") prev?.();
      else if (event.key === "ArrowRight") next?.();
      else if (event.key === "1" && flipped) session.again();
      else if (event.key === "2" && flipped) session.gotIt();
      else if (event.key.toLowerCase() === "u") undo?.();
      else if (event.key === "ArrowUp" || event.key === "ArrowDown" || (event.key === " " && !onControl)) {
        event.preventDefault(); // instead of scrolling the page
        flip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, prev, next, flip, undo, flipped, session]);

  const saying = {
    learned: t`Marked learned`,
    gotIt: t`Got it`,
    again: t`Back in a few cards`,
    now: t`Once more`,
    unlearned: t`Back on your list to learn`,
    undone: t`Undone`,
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 bg-background/95 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      {flipped ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={session.again} title={t`Key: 1`} className="font-semibold">
            <RotateCcw aria-hidden="true" />
            <Trans>Again</Trans>
          </Button>
          <Button size="lg" onClick={session.gotIt} title={t`Key: 2`} className="font-semibold">
            <Check aria-hidden="true" />
            <Trans>Got it</Trans>
          </Button>
        </div>
      ) : (
        <Button size="lg" onClick={flip} className="font-semibold md:self-center md:px-12">
          <Trans>Show answer</Trans>
        </Button>
      )}

      {/* Apart from the rating buttons, and quieter, so a slip here costs nothing. */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={prev} disabled={!prev} aria-label={t`Previous card`}>
          <ChevronLeft aria-hidden="true" />
          <Trans>Previous</Trans>
        </Button>
        {undo && (
          <Button variant="ghost" size="sm" onClick={undo} title={t`Key: U`}>
            <Undo2 aria-hidden="true" />
            <Trans>Undo</Trans>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={next} disabled={!next} aria-label={t`Next card`}>
          <Trans>Next</Trans>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      {/* Always there, so a screen reader hears what a tap did; on a phone only a failure shows, to keep the bar short. */}
      <p aria-live="polite" className={cn("min-h-5 text-center text-caption text-muted-foreground", !saveFailed && "sr-only md:not-sr-only")}>
        {saveFailed ? (
          <span className="text-destructive">
            <Trans>Couldn't save a word as learned. Check your connection.</Trans>
          </span>
        ) : (
          notice && saying[notice]
        )}
      </p>

      <p className="hidden text-center text-caption text-muted-foreground md:block">
        <kbd className={KEY}>Space</kbd> <Trans>flip</Trans> · <kbd className={KEY}>1</kbd> <Trans>Again</Trans> · <kbd className={KEY}>2</kbd>{" "}
        <Trans>Got it</Trans> · <kbd className={KEY}>U</kbd> <Trans>undo</Trans>
      </p>
    </div>
  );
}
