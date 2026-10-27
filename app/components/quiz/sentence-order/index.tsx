import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import { cn } from "cn";
import { useRef, useState } from "react";
import type { QuizQuestion } from "~/lib/views";

export type Slots = (number | null)[];
type Question = Extract<QuizQuestion, { type: "sentence-order" }>;
type DragData = { piece: number };
type DropData = { slot: number } | { bank: true };

const EMPTY: Slots = [null, null, null, null];

/**
 * 文の組み立て: drag pieces into the 4 slots, or tap a piece to drop it in the
 * next empty slot and tap a filled slot to send its piece back.
 */
export function SentenceOrder({
  question,
  slots = EMPTY,
  onChange,
}: {
  question: Question;
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

  const place = (piece: number, slot: number) => {
    const next = [...slots];
    const from = next.indexOf(piece);
    if (from >= 0) next[from] = next[slot];
    next[slot] = piece;
    onChange(next);
  };
  const remove = (piece: number) => onChange(slots.map((p) => (p === piece ? null : p)));
  const placeNext = (piece: number) => {
    const empty = slots.indexOf(null);
    if (empty >= 0 && !slots.includes(piece)) place(piece, empty);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragging((active.data.current as DragData).piece);
  };
  const onDragEnd = ({ active, over, activatorEvent, delta }: DragEndEvent) => {
    setDragging(null);
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false));
    // Drop where the pointer was released. dnd-kit's `over` can lag behind a fast drag.
    const start = getEventCoordinates(activatorEvent);
    const target =
      (start && dropTargetAt(question.id, start.x + delta.x, start.y + delta.y)) ??
      (over?.data.current as DropData | undefined);
    if (!target) return;
    const { piece } = active.data.current as DragData;
    if ("bank" in target) remove(piece);
    else place(piece, target.slot);
  };

  // What screen readers hear; dnd-kit's own words are English.
  const pieceText = (active: Active) => question.pieces[(active.data.current as DragData).piece];
  const zoneText = (over: Over | null) => {
    const zone = over?.data.current as DropData | undefined;
    if (!zone) return null;
    if ("bank" in zone) return "選択肢";
    return zone.slot === question.starSlot - 1 ? "★の空欄" : `空欄${zone.slot + 1}`;
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `「${pieceText(active)}」を持ち上げました。`,
    onDragOver: ({ active, over }) => {
      const zone = zoneText(over);
      return zone ? `「${pieceText(active)}」は${zone}の上にあります。` : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const zone = zoneText(over);
      return zone ? `「${pieceText(active)}」を${zone}に置きました。` : `「${pieceText(active)}」を戻しました。`;
    },
    onDragCancel: ({ active }) => `「${pieceText(active)}」の移動を取り消しました。`,
  };

  return (
    <DndContext
      id={`order-${question.id}`}
      sensors={sensors}
      accessibility={{
        announcements,
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
                if (!justDragged.current && piece !== null) remove(piece);
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
                if (!justDragged.current) placeNext(piece);
              }}
            />
          ))}
        </Bank>
      </div>
      <DragOverlay dropAnimation={null}>
        {dragging !== null && (
          <span className={cn(pill, "cursor-grabbing border-input bg-card shadow-float")}>
            <span className="text-xs text-muted-foreground">{dragging + 1}</span>
            <span>{question.pieces[dragging]}</span>
          </span>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function dropTargetAt(questionId: string, x: number, y: number): DropData | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const zone = element.closest<HTMLElement>("[data-drop]");
    if (zone?.dataset.question !== questionId) continue;
    return zone.dataset.drop === "bank" ? { bank: true } : { slot: Number(zone.dataset.drop) };
  }
  return null;
}

const pill =
  "inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-full border px-3.5 font-jp text-[15px] md:min-h-10";

function SlotButton({
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
        "inline-flex h-10 min-w-16 touch-manipulation items-center justify-center gap-1 rounded-t-md border-b-2 px-2 font-jp text-[15px] outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:min-w-22 md:px-2.5 md:text-base",
        filled
          ? "cursor-grab border-primary bg-primary-soft text-primary-soft-foreground"
          : "cursor-default border-faint bg-muted text-foreground",
        drop.isOver && "ring-2 ring-ring/50",
        drag.isDragging && "opacity-40",
      )}
    >
      {star && <span className="text-xs text-primary md:text-[13px]">★</span>}
      <span>{text}</span>
    </button>
  );
}

function Bank({ questionId, children }: { questionId: string; children: React.ReactNode }) {
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

function BankPiece({
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
  const drag = useDraggable({
    id: `bank-${piece}`,
    data: { piece } satisfies DragData,
    disabled: placed,
    attributes: { roleDescription: "ドラッグ可能" },
  });
  return (
    <button
      type="button"
      ref={drag.setNodeRef}
      {...drag.attributes}
      {...drag.listeners}
      onClick={onTap}
      disabled={placed}
      aria-label={placed ? `${text}（配置済み）` : text}
      className={cn(
        pill,
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
