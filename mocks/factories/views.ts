import { toQuizView, toResultsView } from "~/lib/grading.server";
import type { QuizView, ResultsView, ReviewChip, TestSummary } from "~/lib/views";
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
    weeks: [1],
    result: null,
    review: [],
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
