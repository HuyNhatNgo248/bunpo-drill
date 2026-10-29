import type { StoredTest, Submission } from "~/lib/tests.server";
import { buildPayload } from "./payload";

/**
 * Builders for a saved test and its submission, the shapes in app/lib/tests.server.ts.
 * Each takes the fields to replace and fills the rest.
 */

/**
 * A test that is not taken yet, with the payload of `buildPayload()`.
 *
 * @example
 * buildStoredTest({ reviewed: { "n2-w1-d1-g1": true } }).submission; // -> null
 */
export function buildStoredTest(overrides: Partial<StoredTest> = {}): StoredTest {
  return {
    id: "20261027-abc123",
    createdAt: "2026-10-27T09:00:00.000Z",
    payload: buildPayload(),
    submission: null,
    reviewed: {},
    attempts: [],
    ...overrides,
  };
}

/** A submission with no answers: 0 of the 3 questions of `buildPayload()`. */
export function buildSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    submittedAt: "2026-10-27T09:30:00.000Z",
    answers: {},
    score: 0,
    total: 3,
    wrongGrammarIds: [],
    ...overrides,
  };
}
