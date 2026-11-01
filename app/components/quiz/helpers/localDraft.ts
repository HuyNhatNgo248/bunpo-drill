import type { Answer, Answers, CheckedSections, QuizDraft, ResultSection } from "~/lib/views";

/*
 * Before drafts were saved on the server, the quiz kept its answer sheet and checked parts in the browser.
 * shortcut: takeLocalDraft carries such a sheet over once, so a test left half done goes on; delete this file once no
 * browser holds one.
 */

const keyOf = (testId: string) => `bunpo:answers:${testId}`;
const checksKeyOf = (testId: string) => `bunpo:checked:${testId}`;

const isChoice = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3;

/** A choice, the 4 slots of a sentence-order question, or null. */
const isAnswer = (value: unknown): value is Answer =>
  value === null ||
  isChoice(value) ||
  (Array.isArray(value) && value.length === 4 && value.every((slot) => slot === null || isChoice(slot)));

const isGradedSection = (no: number, value: unknown): value is ResultSection => {
  const section = value as ResultSection | null;
  return (
    typeof section === "object" &&
    section !== null &&
    section.no === no &&
    Number.isInteger(section.correct) &&
    Number.isInteger(section.total) &&
    Array.isArray(section.groups)
  );
};

/** The object saved under `key`, or an empty one. */
function readObject(key: string): Record<string, unknown> {
  const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
  return typeof saved === "object" && saved !== null && !Array.isArray(saved) ? (saved as Record<string, unknown>) : {};
}

/**
 * The answer sheet and checked parts this browser saved for the test, taken out of the browser; null when there are
 * none. Anything that is not an answer, or not a graded part under its own number, is left out.
 */
export function takeLocalDraft(testId: string): QuizDraft | null {
  try {
    const answers = Object.fromEntries(Object.entries(readObject(keyOf(testId))).filter(([, answer]) => isAnswer(answer))) as Answers;
    const checks = Object.fromEntries(
      Object.entries(readObject(checksKeyOf(testId))).filter(([no, section]) => isGradedSection(Number(no), section)),
    ) as CheckedSections;
    localStorage.removeItem(keyOf(testId));
    localStorage.removeItem(checksKeyOf(testId));
    return Object.keys(answers).length || Object.keys(checks).length ? { answers, checks } : null;
  } catch {
    // Storage that is blocked, or a sheet that is not JSON: there is nothing to take.
    return null;
  }
}
