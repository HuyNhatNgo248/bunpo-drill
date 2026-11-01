import { useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";

/** One of the 4 slots: once filled, tap it to send its piece back. */
export function SlotButton({
  index,
  star,
  piece,
  text,
  onTap,
}: {
  index: number;
  star: boolean;
  piece: number | null;
  text: string;
  onTap: () => void;
}) {
  const { t } = useLingui();
  const filled = piece !== null;
  const n = index + 1;
  const slotName = star ? t`★ slot` : t`Slot ${n}`;

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={filled ? t`${slotName}: ${text} (tap to remove)` : slotName}
      className={cn(
        "inline-flex h-10 min-w-16 touch-manipulation items-center justify-center gap-1 rounded-t-md border-b-2 px-2 font-jp text-body-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:min-w-22 md:px-2.5 md:text-base",
        filled
          ? "cursor-pointer border-primary bg-primary-soft text-primary-soft-foreground"
          : "cursor-default border-faint bg-muted text-foreground",
      )}
    >
      {star && <span className="text-xs text-primary md:text-caption">★</span>}
      <span>{text}</span>
    </button>
  );
}
