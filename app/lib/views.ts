import type { Level, SectionType } from "./payload";

/**
 * Shapes the loaders send to the browser. The quiz view never contains
 * answerIndex, correctOrder or grammarId.
 */

export type QuizQuestion =
  | { type: "fill-blank"; id: string; num: number; prompt: string; choices: string[] }
  | { type: "sentence-order"; id: string; num: number; before: string; after: string; starSlot: number; pieces: string[] }
  | { type: "passage"; id: string; num: number; choices: string[] };

export type QuizSegment = { kind: "text"; text: string } | { kind: "blank"; num: number; questionId: string };

/** A run of questions. Passages are one group each, with the passage text as segments. */
export type QuizGroup = { segments: QuizSegment[] | null; questions: QuizQuestion[] };

export type QuizSection = {
  no: number;
  type: SectionType;
  groups: QuizGroup[];
};

export type QuizView = {
  id: string;
  title: string;
  level: Level;
  questionCount: number;
  sections: QuizSection[];
};

/** A choice index for fill-blank and passage, or the 4 slots of a sentence-order question. */
export type Answer = number | (number | null)[] | null;
export type Answers = Record<string, Answer>;

/** A grammar point from a wrong answer, with where it lives in the 文法ノート. */
export type ReviewChip = {
  grammarId: string;
  pattern: string;
  level: Level;
  week: number;
  day: number;
  number: number;
  reviewed: boolean;
};

export type ResultQuestion = {
  id: string;
  num: number;
  type: SectionType;
  correct: boolean;
  /** "2 私の", or null when unanswered. */
  yours: string | null;
  answer: string;
  /** fill-blank: the prompt split around the blank. */
  prompt: { before: string; after: string; fill: string } | null;
  /** sentence-order: the full sentence with pieces in the correct order. */
  sentence: { before: string; after: string; pieces: { text: string; star: boolean }[] } | null;
  /** Why the answer is right, or null for a test made without explanations. */
  explanation: string | null;
};

export type ResultSegment =
  | { kind: "text"; text: string }
  | { kind: "blank"; num: number; fill: string; correct: boolean };

export type ResultGroup = { segments: ResultSegment[] | null; questions: ResultQuestion[] };

export type ResultSection = {
  no: number;
  type: SectionType;
  correct: number;
  total: number;
  groups: ResultGroup[];
};

export type ResultsView = {
  id: string;
  title: string;
  level: Level;
  score: number;
  total: number;
  percent: number;
  sections: ResultSection[];
  review: ReviewChip[];
};

export type TestSummary = {
  id: string;
  title: string;
  level: Level;
  questionCount: number;
  weeks: number[];
  result: { score: number; total: number; percent: number } | null;
  review: ReviewChip[];
};
