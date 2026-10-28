import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import type { DragData, DropData } from "./types";

/** One of the 4 slots: a drop zone, and once filled, a piece to drag away or tap to send back. */
export function SlotButton({
  questionId,
  index,
  star,
  piece,
  text,
  onTap,
}: {
  questionId: string;
  index: number;
  star: boolean;
  piece: number | null;
  text: string;
  onTap: () => void;
}) {
  const filled = piece !== null;
  const drop = useDroppable({ id: `slot-${index}`, data: { slot: index } satisfies DropData });
  const drag = useDraggable({
    id: `slot-piece-${index}`,
    data: { piece: piece ?? -1 } satisfies DragData,
    disabled: !filled,
    attributes: { roleDescription: "ドラッグ可能" },
  });

  return (
    <button
      type="button"
      ref={(node) => {
        drop.setNodeRef(node);
        drag.setNodeRef(node);
      }}
      {...drag.attributes}
      {...drag.listeners}
      onClick={onTap}
      data-drop={index}
      data-question={questionId}
      aria-disabled={undefined}
      aria-label={`${star ? "★の空欄" : `空欄${index + 1}`}${filled ? `：${text}（タップで外す）` : ""}`}
      className={cn(
        "inline-flex h-10 min-w-16 touch-manipulation items-center justify-center gap-1 rounded-t-md border-b-2 px-2 font-jp text-body-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:min-w-22 md:px-2.5 md:text-base",
        filled
          ? "cursor-grab border-primary bg-primary-soft text-primary-soft-foreground"
          : "cursor-default border-faint bg-muted text-foreground",
        drop.isOver && "ring-2 ring-ring/50",
        drag.isDragging && "opacity-40",
      )}
    >
      {star && <span className="text-xs text-primary md:text-caption">★</span>}
      <span>{text}</span>
    </button>
  );
}
