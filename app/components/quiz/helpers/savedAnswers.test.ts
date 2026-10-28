import { describe, expect, it } from "vitest";
import { forgetAnswers, hasSavedAnswers, loadAnswers, savedAnsweredCount, saveAnswers } from "./savedAnswers";

const TEST_ID = "20261028-abc123";
const KEY = `bunpo:answers:${TEST_ID}`;

describe("saved answers", () => {
  it("loads the sheet that was saved for the test", () => {
    saveAnswers(TEST_ID, { q1: 2, q2: [1, null, 3, 0], q3: null });

    expect(loadAnswers(TEST_ID)).toEqual({ q1: 2, q2: [1, null, 3, 0], q3: null });
    expect(loadAnswers("20261028-other0")).toEqual({});
  });

  it("removes the saved sheet when an empty one is saved, and when it is forgotten", () => {
    saveAnswers(TEST_ID, { q1: 2 });
    saveAnswers(TEST_ID, {});
    expect(localStorage.getItem(KEY)).toBeNull();

    saveAnswers(TEST_ID, { q1: 2 });
    forgetAnswers(TEST_ID);
    expect(loadAnswers(TEST_ID)).toEqual({});
  });

  it("tells whether the test has an answer saved, a half-filled sentence order included", () => {
    expect(hasSavedAnswers(TEST_ID)).toBe(false);

    saveAnswers(TEST_ID, { q1: null, q2: [null, null, null, null] });
    expect(hasSavedAnswers(TEST_ID)).toBe(false);

    saveAnswers(TEST_ID, { q2: [null, 1, null, null] });
    expect(hasSavedAnswers(TEST_ID)).toBe(true);
  });

  it("counts a picked choice and a full sentence order as answered, a half-filled one not", () => {
    saveAnswers(TEST_ID, { q1: 2, q2: [0, 1, 2, 3], q3: [null, 1, null, null], q4: null });

    expect(savedAnsweredCount(TEST_ID)).toBe(2);
  });

  it("leaves out anything that is not an answer, and reads broken JSON as an empty sheet", () => {
    localStorage.setItem(KEY, JSON.stringify({ q1: 1, q2: "x", q3: 7, q4: [1, 2], q5: [0, 1, 2, 9] }));
    expect(loadAnswers(TEST_ID)).toEqual({ q1: 1 });

    localStorage.setItem(KEY, "{not json");
    expect(loadAnswers(TEST_ID)).toEqual({});

    localStorage.setItem(KEY, "[1, 2]");
    expect(loadAnswers(TEST_ID)).toEqual({});
  });
});
