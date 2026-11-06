import { questionCount } from "./grading.server";
import { isKanji, isReading, parseAnyPayload } from "./test-kinds";
import type { StoredTest } from "./tests.server";
import type { TrialSummary } from "./views";

/**
 * The mock tests a visitor can take before signing up, at /try/:id: 3 per level in trial-tests/. Each takes every third
 * point of its level's 文法ノート (or of an even sample, when a level has more points than 3 tests hold), so each spans
 * every week and day, and no point is in two. They are files in the repo, not rows, so every deploy has them, and
 * nothing a visitor does with them is saved. A file's name is its test's id: n3-1.json is /try/n3-1.
 * The reading-* files are reading sets copied from the database. The kanji-* files are 総合 tests built from every
 * chapter's test, no question in two.
 * shortcut: the kanji format ties word ids to one chapter, so a 総合 test's ids all say chapter 1; fine while trials never
 * link to flashcards, upgrade the format if they should.
 */
const files = import.meta.glob("./trial-tests/*.json", { eager: true, import: "default" });

export const TRIAL_TESTS: StoredTest[] = Object.entries(files).map(([path, json]) => {
  const parsed = parseAnyPayload(json);
  // Read when the server starts, so a broken file stops the server instead of a visitor's test.
  if (!parsed.ok) throw new Error(`${path} is not a valid test: ${parsed.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  const id = path.slice(path.lastIndexOf("/") + 1, -".json".length);
  return { id, createdAt: "", payload: parsed.payload, submission: null, draft: null, reviewed: {}, attempts: [] };
});

export const getTrialTest = (id: string) => TRIAL_TESTS.find((test) => test.id === id) ?? null;

export function trialSummaries(): TrialSummary[] {
  return TRIAL_TESTS.map(({ id, payload }) => ({
    id,
    kind: isKanji(payload) ? "kanji" : isReading(payload) ? "reading" : "grammar",
    title: payload.title,
    level: payload.level,
    questionCount: questionCount(payload),
  }));
}
