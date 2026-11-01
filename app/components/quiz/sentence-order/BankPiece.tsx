import { useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";

/** A piece in the bank: tap it to fill the next empty slot. It greys out once placed. */
export function BankPiece({
  piece,
  text,
  placed,
  onTap,
}: {
  piece: number;
  text: string;
  placed: boolean;
  onTap: () => void;
}) {
  const { t } = useLingui();
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={placed}
      aria-label={placed ? t`${text} (placed)` : text}
      className={cn(
        "inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-full border px-3.5 font-jp text-body-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:min-h-10",
        placed
          ? "cursor-default border-dashed border-input bg-transparent text-faint"
          : "cursor-pointer border-input bg-card text-foreground shadow-piece",
      )}
    >
      <span className={cn("text-xs", placed ? "text-faint" : "text-muted-foreground")}>{piece + 1}</span>
      <span>{text}</span>
    </button>
  );
}
