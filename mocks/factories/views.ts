import { toQuizView, toResultsView, toSubmission } from "~/lib/grading.server";
import { toFlashcards } from "~/lib/kanji-views.server";
import type { ChapterSummary, FlashCard, FlashcardsView, NoteView, QuizView, ResultsView, ReviewChip, TestSummary } from "~/lib/views";
import { buildKanjiChapter, buildKanjiTestPayload, WORD_ID } from "./kanji";
import { GRAMMAR_ID } from "./payload";
import { buildReadingPayload } from "./reading";
import { buildStoredTest, buildSubmission } from "./tests";

/**
 * Builders for the views that the pages draw, the shapes in app/lib/views.ts.
 * The quiz and the results come from the app's own converters, so they match what a loader returns.
 */

export function buildReviewChip(overrides: Partial<ReviewChip> = {}): ReviewChip {
  return { grammarId: GRAMMAR_ID, pattern: "〜かいがある", level: "N2", week: 1, day: 1, number: 1, reviewed: false, ...overrides };
}

/** A test that is not taken yet, as the home page lists it. */
export function buildTestSummary(overrides: Partial<TestSummary> = {}): TestSummary {
  return {
    id: "20261027-abc123",
    title: "第1週 1日目",
    level: "N2",
    questionCount: 3,
    result: null,
    review: [],
    previous: null,
    answered: null,
    weeks: [1],
    patterns: ["〜かいがある"],
    ...overrides,
  };
}

/** The quiz of `buildStoredTest()`: q1 fill-blank, q2 sentence-order, q3 passage. */
export function buildQuizView(overrides: Partial<QuizView> = {}): QuizView {
  return { ...toQuizView(buildStoredTest()), ...overrides };
}

/** The results of `buildStoredTest()` with no answers: 0 of 3, and the one grammar point to review. */
export function buildResultsView(overrides: Partial<ResultsView> = {}): ResultsView {
  return { ...toResultsView(buildStoredTest(), buildSubmission()), ...overrides };
}

/** 1章 生活-1 as the kanji page lists it: 96 words, 24 learned, in two lessons (ギフト, 料理), its quiz not taken yet. */
export function buildChapterSummary(overrides: Partial<ChapterSummary> = {}): ChapterSummary {
  return {
    chapter: 1,
    title: "生活-1",
    words: 96,
    learned: 24,
    lessons: [
      { title: "ギフト", page: 20, words: 50, learned: 24 },
      { title: "料理", page: 21, words: 46, learned: 0 },
    ],
    quiz: { id: "20261031-aaaaaa", result: null },
    ...overrides,
  };
}

/** The card of 招待状, not learned yet, under 招 in the ギフト lesson. */
export function buildFlashCard(overrides: Partial<FlashCard> = {}): FlashCard {
  return {
    wordId: WORD_ID,
    word: "招待状",
    reading: "しょうたいじょう",
    meaning: "invitation card",
    learned: false,
    repeat: false,
    lesson: { title: "ギフト", page: 20 },
    kanji: [
      { char: "招", kun: ["まね-く"], on: ["ショウ"], strokes: 8 },
      { char: "待", kun: ["ま-つ"], on: ["タイ"], strokes: null },
      { char: "状", kun: [], on: ["ジョウ"], strokes: null },
    ],
    headword: "招",
    related: [],
    examples: [],
    ...overrides,
  };
}

/** A flashcard session on `buildKanjiChapter()`, nothing learned yet: its one card, 招待状. */
export function buildFlashcardsView(overrides: Partial<FlashcardsView> = {}): FlashcardsView {
  return { ...toFlashcards(buildKanjiChapter(), new Set(), undefined, null), ...overrides };
}

/** The quiz of a kanji test on 招待状 (`buildKanjiTestPayload()`): q1 漢字読み, q2 表記. */
export function buildKanjiQuizView(overrides: Partial<QuizView> = {}): QuizView {
  return { ...toQuizView(buildStoredTest({ payload: buildKanjiTestPayload() })), ...overrides };
}

/** The results of that kanji test with no answers: 0 of 2, and 招待状 to study. */
export function buildKanjiResultsView(overrides: Partial<ResultsView> = {}): ResultsView {
  return { ...toResultsView(buildStoredTest({ payload: buildKanjiTestPayload() }), buildSubmission({ total: 2 })), ...overrides };
}

/** 考えた末, noted from question 14 of 第3週 1〜3日目, with no memo. */
export function buildNoteView(overrides: Partial<NoteView> = {}): NoteView {
  return {
    id: 1,
    text: "考えた末",
    sentence: "社長は何か月も考えた末、海外の工場を閉めることに決めた。",
    memo: "",
    testId: "20261027-abc123",
    anchor: "question-14",
    testTitle: "第3週 1〜3日目",
    ...overrides,
  };
}

/** The quiz of 短文 1 (`buildReadingPayload()`): one passage, one question. */
export function buildReadingQuizView(overrides: Partial<QuizView> = {}): QuizView {
  return { ...toQuizView(buildStoredTest({ payload: buildReadingPayload() })), ...overrides };
}

/** The results of 短文 1 answered 1 (wrong: the opposite trap), its passage read in 2:13 against 2:00. */
export function buildReadingResultsView(overrides: Partial<ResultsView> = {}): ResultsView {
  const test = buildStoredTest({ payload: buildReadingPayload() });
  return { ...toResultsView(test, toSubmission(test.payload, { q1: 0 }, [133])), ...overrides };
}
