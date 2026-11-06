import { describe, expect, it } from "vitest";
import { questionCount } from "./grading.server";
import { getTrialTest, TRIAL_TESTS } from "./trials.server";

/** The levels the welcome page has trial tests for. */
const TRIAL_LEVELS = ["N3", "N2"] as const;

describe("TRIAL_TESTS", () => {
  it("has 3 full tests per level that has trials, named by level and number", () => {
    for (const level of TRIAL_LEVELS) {
      const ids = TRIAL_TESTS.filter((test) => test.payload.level === level).map((test) => test.id);
      expect(ids.sort()).toEqual([1, 2, 3].map((n) => `${level.toLowerCase()}-${n}`));
    }
    for (const test of TRIAL_TESTS) expect(questionCount(test.payload)).toBe(45);
  });

  it("splits a level's grammar between its tests, so no point is in two", () => {
    for (const level of TRIAL_LEVELS) {
      const ids = TRIAL_TESTS.filter((test) => test.payload.level === level).flatMap((test) => test.payload.grammarPoints.map((point) => point.id));
      expect(new Set(ids).size).toBe(ids.length);
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
