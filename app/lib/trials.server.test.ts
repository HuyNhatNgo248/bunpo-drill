import { describe, expect, it } from "vitest";
import { questionCount } from "./grading.server";
import { isKanji, isReading } from "./test-kinds";
import { getTrialTest, TRIAL_TESTS } from "./trials.server";

/** The levels the welcome page has trial tests for. */
const TRIAL_LEVELS = ["N3", "N2"] as const;

const GRAMMAR = TRIAL_TESTS.filter(({ payload }) => !isKanji(payload) && !isReading(payload));

describe("TRIAL_TESTS", () => {
  it("has 3 full tests per level that has trials, named by level and number", () => {
    for (const level of TRIAL_LEVELS) {
      const ids = GRAMMAR.filter((test) => test.payload.level === level).map((test) => test.id);
      expect(ids.sort()).toEqual([1, 2, 3].map((n) => `${level.toLowerCase()}-${n}`));
    }
    for (const test of GRAMMAR) expect(questionCount(test.payload)).toBe(45);
  });

  it("splits a level's grammar between its tests, so no point is in two", () => {
    for (const level of TRIAL_LEVELS) {
      const ids = GRAMMAR.flatMap(({ payload }) => (payload.level === level && "grammarPoints" in payload ? payload.grammarPoints.map((point) => point.id) : []));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("has 3 総合 kanji tests of 45 per level, no question in two, and 3 reading sets", () => {
    for (const level of TRIAL_LEVELS) {
      const kanji = TRIAL_TESTS.flatMap(({ payload }) => (isKanji(payload) && payload.level === level ? [payload] : []));
      expect(kanji.map((payload) => payload.title)).toEqual(["総合 1", "総合 2", "総合 3"]);
      for (const payload of kanji) expect(questionCount(payload)).toBe(45);
      const prompts = kanji.flatMap((payload) => payload.sections.flatMap((section) => section.questions.map((question) => question.prompt)));
      expect(new Set(prompts).size).toBe(prompts.length);
    }
    for (const level of TRIAL_LEVELS) {
      const reading = TRIAL_TESTS.filter(({ id, payload }) => isReading(payload) && payload.level === level && id.startsWith(`reading-${level.toLowerCase()}-`));
      expect(reading.map(({ payload }) => payload.title).sort()).toEqual(["総合 1", "総合 2", "総合 3"]);
    }
  });
});

describe("getTrialTest", () => {
  it("finds a trial test by its id, and nothing else", () => {
    expect(getTrialTest("n3-1")?.payload.level).toBe("N3");
    expect(getTrialTest("n3-9")).toBeNull();
    expect(getTrialTest("20261027-abc123")).toBeNull();
  });
});
