import { useLingui } from "@lingui/react/macro";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import type { DragData } from "./types";

/** The pill shape of a piece, in the bank and while it is dragged. */
export const PILL =
  "inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-full border px-3.5 font-jp text-body-sm md:min-h-10";

/** A piece in the bank: drag it to a slot, or tap it to fill the next empty slot. It greys out once placed. */
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
  const drag = useDraggable({
    id: `bank-${piece}`,
    data: { piece } satisfies DragData,
    disabled: placed,
    attributes: { roleDescription: t`draggable` },
  });
  return (
    <button
      type="button"
      ref={drag.setNodeRef}
      {...drag.attributes}
      {...drag.listeners}
      onClick={onTap}
      disabled={placed}
      aria-label={placed ? t`${text} (placed)` : text}
      className={cn(
        PILL,
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        placed
          ? "cursor-default border-dashed border-input bg-transparent text-faint"
          : "cursor-grab border-input bg-card text-foreground shadow-piece",
        drag.isDragging && "opacity-40",
      )}
    >
      <span className={cn("text-xs", placed ? "text-faint" : "text-muted-foreground")}>{piece + 1}</span>
      <span>{text}</span>
    </button>
  );
}
