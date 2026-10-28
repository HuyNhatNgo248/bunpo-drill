import type { Answer, Answers } from "~/lib/views";

/**
 * The answer sheet of a test that is not submitted yet, kept in this browser so leaving the page loses nothing.
 * Storage that is blocked or full keeps nothing, and the quiz works as before.
 * shortcut: per browser, not per account; save drafts on the server if a test must continue on another device.
 */

const keyOf = (testId: string) => `bunpo:answers:${testId}`;

const isChoice = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3;

/** A choice, the 4 slots of a sentence-order question, or null. */
const isAnswer = (value: unknown): value is Answer =>
  value === null ||
  isChoice(value) ||
  (Array.isArray(value) && value.length === 4 && value.every((slot) => slot === null || isChoice(slot)));

/** The saved sheet, or an empty one when there is none. Anything that is not an answer is left out. */
export function loadAnswers(testId: string): Answers {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(keyOf(testId)) ?? "{}");
    if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([, answer]) => isAnswer(answer))) as Answers;
  } catch {
    return {};
  }
}

/** True when the test has a saved sheet with at least one answer, even a half-filled sentence order. */
export function hasSavedAnswers(testId: string): boolean {
  return Object.values(loadAnswers(testId)).some((answer) => (Array.isArray(answer) ? answer.some((slot) => slot !== null) : answer !== null));
}

/** How many questions the saved sheet answers: a picked choice, or a sentence order with all 4 slots filled. */
export function savedAnsweredCount(testId: string): number {
  return Object.values(loadAnswers(testId)).filter((answer) =>
    Array.isArray(answer) ? answer.every((slot) => slot !== null) : answer !== null,
  ).length;
}

/** Saves the sheet. An empty sheet removes the saved one. */
export function saveAnswers(testId: string, answers: Answers): void {
  try {
    if (Object.keys(answers).length) localStorage.setItem(keyOf(testId), JSON.stringify(answers));
    else localStorage.removeItem(keyOf(testId));
  } catch {
    // Blocked or full: nothing is kept.
  }
}

/** Drops the saved sheet, once the test is submitted. */
export function forgetAnswers(testId: string): void {
  try {
    localStorage.removeItem(keyOf(testId));
  } catch {
    // Blocked: there is nothing to drop.
  }
}
