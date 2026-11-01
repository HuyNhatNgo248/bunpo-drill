import type { QuizQuestion } from "~/lib/views";

/** The piece index in each of the 4 slots, or null for an empty slot. */
export type Slots = (number | null)[];

export type OrderQuestion = Extract<QuizQuestion, { type: "sentence-order" }>;
