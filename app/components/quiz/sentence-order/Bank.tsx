import { useDroppable } from "@dnd-kit/core";
import { cn } from "cn";
import type { DropData } from "./types";

/** The box of pieces. A piece dropped here leaves its slot. */
export function Bank({ questionId, children }: { questionId: string; children: React.ReactNode }) {
  const drop = useDroppable({ id: "bank", data: { bank: true } satisfies DropData });
  return (
    <div
      ref={drop.setNodeRef}
      data-drop="bank"
      data-question={questionId}
      className={cn(
        "flex min-h-11 flex-wrap gap-2 rounded-[10px] border border-dashed border-input bg-background p-2.5 md:p-3",
        drop.isOver && "border-primary-border bg-primary-soft",
      )}
    >
      {children}
    </div>
  );
}
