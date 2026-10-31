import { toQuizView, toResultsView } from "~/lib/grading.server";
import { toFlashcards } from "~/lib/kanji-views.server";
import type { ChapterSummary, FlashCard, FlashcardsView, QuizView, ResultsView, ReviewChip, TestSummary } from "~/lib/views";
import { buildKanjiChapter, buildKanjiTestPayload, WORD_ID } from "./kanji";
import { GRAMMAR_ID } from "./payload";
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

/** 1章 生活-1 as the kanji page lists it: 96 words, 24 learned, its quiz not taken yet. */
export function buildChapterSummary(overrides: Partial<ChapterSummary> = {}): ChapterSummary {
  return { chapter: 1, title: "生活-1", words: 96, learned: 24, quiz: { id: "20261031-aaaaaa", result: null }, ...overrides };
}

/** The card of 招待状, not learned yet, under 招 in the ギフト lesson. */
export function buildFlashCard(overrides: Partial<FlashCard> = {}): FlashCard {
  return {
    wordId: WORD_ID,
    word: "招待状",
    reading: "しょうたいじょう",
    meaning: "invitation card",
    learned: false,
    lesson: { title: "ギフト", page: 20 },
    kanji: [
      { char: "招", kun: ["まね-く"], on: ["ショウ"], strokes: 8 },
      { char: "待", kun: ["ま-つ"], on: ["タイ"], strokes: null },
      { char: "状", kun: [], on: ["ジョウ"], strokes: null },
    ],
    headword: "招",
    related: [],
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
