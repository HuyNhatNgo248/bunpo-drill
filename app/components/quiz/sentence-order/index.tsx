import { BankPiece } from "./BankPiece";
import { EMPTY_SLOTS, placeInNextSlot, removePiece } from "./helpers/slots";
import { SlotButton } from "./SlotButton";
import type { OrderQuestion, Slots } from "./types";

/**
 * 文の組み立て: tap a piece to put it in the next empty slot, and tap a filled slot to send its piece back.
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
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div lang="ja" className="flex flex-wrap items-end gap-1.5 font-jp text-prompt leading-sentence md:gap-2 md:text-xl">
        <span>{question.before}</span>
        {slots.map((piece, index) => (
          <SlotButton
            key={index}
            index={index}
            star={index === question.starSlot - 1}
            piece={piece}
            text={piece === null ? "" : question.pieces[piece]}
            onTap={() => piece !== null && onChange(removePiece(slots, piece))}
          />
        ))}
        <span>{question.after}</span>
      </div>
      <div className="flex min-h-11 flex-wrap gap-2 rounded-box border border-dashed border-input bg-background p-2.5 md:p-3">
        {question.pieces.map((text, piece) => (
          <BankPiece
            key={piece}
            piece={piece}
            text={text}
            placed={slots.includes(piece)}
            onTap={() => {
              const next = placeInNextSlot(slots, piece);
              if (next) onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}
