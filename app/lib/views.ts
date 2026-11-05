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

export type SentencePiece = { text: string; star: boolean };

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
  /** sentence-order: the full sentence with pieces in the correct order, and in the learner's (null when ★ is empty). */
  sentence: { before: string; after: string; pieces: SentencePiece[]; yours: SentencePiece[] | null } | null;
  /** kanji: the sentence around its underlined word. */
  underlined: Underlined | null;
  /** Why the answer is right, or null for a test made without explanations. */
  explanation: string | null;
};

/** Words the user highlighted in a test, as the notes page lists them. */
export type NoteView = {
  id: number;
  text: string;
  sentence: string;
  memo: string;
  testId: string;
  /** The question or passage on the test's page that the words came from, or null for an older note. */
  anchor: string | null;
  testTitle: string;
};

/** A note as a test highlights it: its words and memo. */
export type NoteMark = Pick<NoteView, "id" | "text" | "memo">;

/** A word a kanji test got wrong, to study as a flashcard. */
export type WordChip = { wordId: string; word: string; reading: string };

/** A chapter as the kanji page lists it: how many of its words are learned, its lessons, and its newest quiz. */
export type ChapterSummary = {
  chapter: number;
  title: string;
  words: number;
  learned: number;
  /** One per page of the book, in its order, with how many of their words are learned. */
  lessons: { title: string; page: number; words: number; learned: number }[];
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
  /** Seen in the session before this one and not learned yet. */
  repeat: boolean;
  lesson: { title: string; page: number };
  /** Every kanji of the word, in order; `strokes` only for the chapter's own kanji, which the book counts. */
  kanji: { char: string; kun: string[]; on: string[]; strokes: number | null }[];
  /** The kanji the book teaches the word under, its other words, and sentences with its words, the word underlined. */
  headword: string;
  related: { word: string; reading: string }[];
  examples: { sentence: Underlined; meaning: string }[];
};

/** A flashcard session on one chapter, or on one lesson of it. */
export type FlashcardsView = {
  level: Level;
  chapter: number;
  title: string;
  /** The lesson the session is on; null for the whole chapter. */
  lesson: FlashCard["lesson"] | null;
  cards: FlashCard[];
  /** New words to learn, learned ones to review (`?review`), or the words asked for (a quiz's misses, `?words`). */
  source: "new" | "review" | "picked";
  /** The lesson after this one, for a session on a lesson; null on a chapter or the last lesson. */
  nextLesson: FlashCard["lesson"] | null;
  /** How many cards a full session has. */
  size: number;
  /** The words of the chapter (of the lesson, on one), and how many of them were learned before the session. */
  words: number;
  learned: number;
  quiz: ChapterSummary["quiz"];
};

/** The kanji page of one level: its chapters. */
export type KanjiHomeView = {
  level: JlptLevel;
  chapters: ChapterSummary[];
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

/** The parts checked so far, by part number, graded. Their answers are locked. */
export type CheckedSections = Record<number, ResultSection>;

/** Where a test that is not submitted yet was left: its answer sheet and its checked parts. */
export type QuizDraft = {
  answers: Answers;
  checks: CheckedSections;
  /** A retake of the wrong answers: the questions answered right last time, kept and not shown. */
  kept?: string[];
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
  /** How many questions its unsubmitted answer sheet answers; null until it is started. */
  answered: number | null;
  /** The weeks of the 文法ノート it covers, first first. */
  weeks: number[];
  /** The grammar patterns it tests ("〜あげく"), each once, for the search. */
  patterns: string[];
};

/** A trial test as the welcome page shows it: no questions, and how many grammar points it tests. */
export type TrialSummary = { id: string; title: string; level: Level; questionCount: number; patternCount: number };
