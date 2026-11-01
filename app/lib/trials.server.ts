import { questionCount } from "./grading.server";
import { parsePayload, type TestPayload } from "./payload";
import type { StoredTest } from "./tests.server";
import type { TrialSummary } from "./views";

/**
 * The mock tests a visitor can take before signing up, at /try/:id: 3 per level in trial-tests/. Each takes every third
 * point of its level's 文法ノート, so each spans every week and day, and the three together cover it all. They are files in the repo, not rows, so every deploy has them, and
 * nothing a visitor does with them is saved. A file's name is its test's id: n3-1.json is /try/n3-1.
 */
const files = import.meta.glob("./trial-tests/*.json", { eager: true, import: "default" });

export const TRIAL_TESTS: (Omit<StoredTest, "payload"> & { payload: TestPayload })[] = Object.entries(files).map(([path, json]) => {
  const parsed = parsePayload(json);
  // Read when the server starts, so a broken file stops the server instead of a visitor's test.
  if (!parsed.ok) throw new Error(`${path} is not a valid test: ${parsed.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  const id = path.slice(path.lastIndexOf("/") + 1, -".json".length);
  return { id, createdAt: "", payload: parsed.payload, submission: null, draft: null, reviewed: {}, attempts: [] };
});

export const getTrialTest = (id: string) => TRIAL_TESTS.find((test) => test.id === id) ?? null;

export function trialSummaries(): TrialSummary[] {
  return TRIAL_TESTS.map(({ id, payload }) => ({
    id,
    title: payload.title,
    level: payload.level,
    questionCount: questionCount(payload),
    patternCount: payload.grammarPoints.length,
    weeks: [...new Set(payload.grammarPoints.map((point) => point.week))].sort((a, b) => a - b),
  }));
}
