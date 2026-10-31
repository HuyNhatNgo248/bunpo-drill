import type { JlptLevel, Level, SectionType } from "./payload";

/**
 * Shapes the loaders send to the browser. The quiz view never contains
 * answerIndex, correctOrder, grammarId or wordId.
 */

/** A grammar test or a kanji test (漢字読み and 表記 on one chapter). */
export type TestKind = "grammar" | "kanji";

/** A kanji question's sentence around the word it underlines. */
export type Underlined = { before: string; word: string; after: string };

export type QuizQuestion =
  | { type: "fill-blank"; id: string; num: number; prompt: string; choices: string[] }
  | { type: "sentence-order"; id: string; num: number; before: string; after: string; starSlot: number; pieces: string[] }
  | { type: "passage"; id: string; num: number; choices: string[] }
  | { type: "kanji-reading" | "kanji-writing"; id: string; num: number; prompt: Underlined; choices: string[] };

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
  kind: TestKind;
  /** A kanji test's chapter; null for grammar. */
  chapter: number | null;
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
  /** kanji: the sentence around its underlined word. */
  underlined: Underlined | null;
  /** Why the answer is right, or null for a test made without explanations. */
  explanation: string | null;
};

/** A word a kanji test got wrong, to study as a flashcard. */
export type WordChip = { wordId: string; word: string; reading: string };

/** A chapter as the kanji page lists it: how many of its words are learned, and its newest quiz. */
export type ChapterSummary = {
  chapter: number;
  title: string;
  words: number;
  learned: number;
  /** null until Claude makes a quiz on the chapter; `result` null until it is taken. */
  quiz: { id: string; result: { score: number; total: number } | null } | null;
};

/** One flashcard: a word of a chapter, with what its back shows. */
export type FlashCard = {
  wordId: string;
  word: string;
  reading: string;
  meaning: string;
  learned: boolean;
  lesson: { title: string; page: number };
  /** Every kanji of the word, in order; `strokes` only for the chapter's own kanji, which the book counts. */
  kanji: { char: string; kun: string[]; on: string[]; strokes: number | null }[];
  /** The kanji the book teaches the word under, and its other words. */
  headword: string;
  related: { word: string; reading: string }[];
};

/** A flashcard session on one chapter. */
export type FlashcardsView = {
  level: Level;
  chapter: number;
  title: string;
  cards: FlashCard[];
  /** The chapter's words, and how many of them were learned before the session. */
  words: number;
  learned: number;
  quiz: ChapterSummary["quiz"];
};

/** The kanji page of one level: its figures, then its chapters. */
export type KanjiHomeView = {
  level: JlptLevel;
  chapters: ChapterSummary[];
  /** `average`: of the chapters' newest quizzes that are taken. `missed`: their wrong words not learned since. */
  stats: { learned: number; words: number; average: number | null; missed: number };
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
  kind: TestKind;
  /** A kanji test's chapter; null for grammar. */
  chapter: number | null;
  score: number;
  total: number;
  percent: number;
  sections: ResultSection[];
  /** The grammar of the wrong answers; empty on a kanji test. */
  review: ReviewChip[];
  /** The words of the wrong answers; empty on a grammar test. */
  words: WordChip[];
  /** The score of the attempt before this one, or null on the first. */
  previous: { score: number; total: number } | null;
};

export type TestSummary = {
  id: string;
  title: string;
  level: Level;
  questionCount: number;
  result: { score: number; total: number; percent: number } | null;
  review: ReviewChip[];
  /** The score of the attempt before `result`, or the last score while a retake is under way. */
  previous: { score: number; total: number } | null;
};
