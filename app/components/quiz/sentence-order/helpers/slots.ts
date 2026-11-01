import type { Slots } from "../types";

/** The slots before the first piece is placed. */
export const EMPTY_SLOTS: Slots = [null, null, null, null];

/** Puts `piece` in `slot`. A piece that is already in another slot swaps places with what `slot` held. */
export function placePiece(slots: Slots, piece: number, slot: number): Slots {
  const next = [...slots];
  const from = next.indexOf(piece);
  if (from >= 0) next[from] = next[slot];
  next[slot] = piece;
  return next;
}

/** Takes `piece` out of its slot. */
export function removePiece(slots: Slots, piece: number): Slots {
  return slots.map((p) => (p === piece ? null : p));
}

/** Puts `piece` in the first empty slot. Null when every slot is full or the piece is already placed. */
export function placeInNextSlot(slots: Slots, piece: number): Slots | null {
  const empty = slots.indexOf(null);
  return empty >= 0 && !slots.includes(piece) ? placePiece(slots, piece, empty) : null;
}
