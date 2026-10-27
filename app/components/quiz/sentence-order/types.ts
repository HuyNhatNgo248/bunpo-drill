import type { QuizQuestion } from "~/lib/views";

/** The piece index in each of the 4 slots, or null for an empty slot. */
export type Slots = (number | null)[];

export type OrderQuestion = Extract<QuizQuestion, { type: "sentence-order" }>;

/** What a dragged element carries: the piece it holds. */
export type DragData = { piece: number };

/** What a drop zone carries: its slot, or the bank of pieces. */
export type DropData = { slot: number } | { bank: true };
