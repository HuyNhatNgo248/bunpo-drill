import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import { cn } from "cn";
import { useRef, useState } from "react";
import { Bank } from "./Bank";
import { BankPiece, PILL } from "./BankPiece";
import { pieceAnnouncements } from "./helpers/announcements";
import { dropTargetAt } from "./helpers/dropTarget";
import { EMPTY_SLOTS, placeInNextSlot, placePiece, removePiece } from "./helpers/slots";
import { SlotButton } from "./SlotButton";
import type { DragData, DropData, OrderQuestion, Slots } from "./types";

/**
 * 文の組み立て: drag pieces into the 4 slots, or tap a piece to drop it in the
 * next empty slot and tap a filled slot to send its piece back.
 */
export function SentenceOrder({
  question,
  slots = EMPTY_SLOTS,
  onChange,
}: {
  question: OrderQuestion;
  /** Piece index per slot; undefined until the first piece is placed. */
  slots: Slots | undefined;
  onChange: (slots: Slots) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Hold briefly before dragging on touch screens so the page still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );
  const [dragging, setDragging] = useState<number | null>(null);
  // A drag that ends where it started also fires a click; ignore that click.
  const justDragged = useRef(false);

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragging((active.data.current as DragData).piece);
  };
  const onDragEnd = ({ active, over, activatorEvent, delta }: DragEndEvent) => {
    setDragging(null);
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false));
    const start = getEventCoordinates(activatorEvent);
    const target =
      (start && dropTargetAt(question.id, start.x + delta.x, start.y + delta.y)) ??
      (over?.data.current as DropData | undefined);
    if (!target) return;
    const { piece } = active.data.current as DragData;
    onChange("bank" in target ? removePiece(slots, piece) : placePiece(slots, piece, target.slot));
  };

  return (
    <DndContext
      id={`order-${question.id}`}
      sensors={sensors}
      accessibility={{
        announcements: pieceAnnouncements(question),
        screenReaderInstructions: { draggable: "選択肢を押すと次の空欄に入り、埋まった空欄を押すと選択肢に戻ります。" },
      }}
      autoScroll={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="flex flex-col gap-3 md:gap-4">
        <div lang="ja" className="flex flex-wrap items-end gap-1.5 font-jp text-[17px] leading-[1.7] md:gap-2 md:text-xl">
          <span>{question.before}</span>
          {slots.map((piece, index) => (
            <SlotButton
              key={index}
              questionId={question.id}
              index={index}
              star={index === question.starSlot - 1}
              piece={piece}
              text={piece === null ? "" : question.pieces[piece]}
              onTap={() => {
                if (!justDragged.current && piece !== null) onChange(removePiece(slots, piece));
              }}
            />
          ))}
          <span>{question.after}</span>
        </div>
        <Bank questionId={question.id}>
          {question.pieces.map((text, piece) => (
            <BankPiece
              key={piece}
              piece={piece}
              text={text}
              placed={slots.includes(piece)}
              onTap={() => {
                const next = justDragged.current ? null : placeInNextSlot(slots, piece);
                if (next) onChange(next);
              }}
            />
          ))}
        </Bank>
      </div>
      <DragOverlay dropAnimation={null}>
        {dragging !== null && (
          <span className={cn(PILL, "cursor-grabbing border-input bg-card shadow-float")}>
            <span className="text-xs text-muted-foreground">{dragging + 1}</span>
            <span>{question.pieces[dragging]}</span>
          </span>
        )}
      </DragOverlay>
    </DndContext>
  );
}
