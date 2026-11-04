import { Trans, useLingui } from "@lingui/react/macro";
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import type { useSession } from "./hooks/useSession";

/**
 * The buttons under a card: ‹ and ›, then Show answer, or Again and Got it once it is flipped. Space or ↑ ↓ flip it,
 * ← and → step through the cards.
 */
export function CardControls({ session }: { session: ReturnType<typeof useSession> }) {
  const { t } = useLingui();
  const { current, prev, next, flip } = session;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // With a modifier, the keys are the browser's (Alt+← goes back a page).
      if (!current || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      // Space on a focused button or link presses it, as anywhere else; ↑ and ↓ flip whatever has focus.
      const onControl = event.target instanceof Element && event.target.closest("button, a, input, select, textarea");
      if (event.key === "ArrowLeft") prev?.();
      else if (event.key === "ArrowRight") next?.();
      else if (event.key === "ArrowUp" || event.key === "ArrowDown" || (event.key === " " && !onControl)) {
        event.preventDefault(); // instead of scrolling the page
        flip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, prev, next, flip]);

  return (
    <div className="flex justify-center gap-2">
      <Button variant="outline" size="lg" onClick={prev} disabled={!prev} aria-label={t`Previous card`} className="aspect-square px-0">
        <ChevronLeft aria-hidden="true" />
      </Button>
      {session.flipped ? (
        <div className="grid flex-1 grid-cols-2 gap-2 md:flex-none">
          <Button variant="outline" size="lg" onClick={session.again} className="font-semibold">
            <RotateCcw aria-hidden="true" />
            <Trans>Again</Trans>
          </Button>
          <Button size="lg" onClick={session.gotIt} className="font-semibold">
            <Check aria-hidden="true" />
            <Trans>Got it</Trans>
          </Button>
        </div>
      ) : (
        <Button size="lg" onClick={flip} className="flex-1 font-semibold md:flex-none md:px-8">
          <Trans>Show answer</Trans>
        </Button>
      )}
      <Button variant="outline" size="lg" onClick={next} disabled={!next} aria-label={t`Next card`} className="aspect-square px-0">
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
