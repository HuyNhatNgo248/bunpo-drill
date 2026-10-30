import { describe, expect, it } from "vitest";
import { buildResultsView } from "#mocks/factories/views";
import {
  forgetAnswers,
  hasSavedAnswers,
  loadAnswers,
  loadChecks,
  savedAnsweredCount,
  saveAnswers,
  saveChecks,
} from "./savedAnswers";

const TEST_ID = "20261028-abc123";
const KEY = `bunpo:answers:${TEST_ID}`;
const CHECKS_KEY = `bunpo:checked:${TEST_ID}`;

/** Part 1 of the test, graded. */
const PART_1 = buildResultsView().sections[0];

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

describe("saved checked parts", () => {
  it("loads the parts that were checked, and forgets them with the sheet", () => {
    saveAnswers(TEST_ID, { q1: 2 });
    saveChecks(TEST_ID, { 1: PART_1 });

    expect(loadChecks(TEST_ID)).toEqual({ 1: PART_1 });

    forgetAnswers(TEST_ID);
    expect(localStorage.getItem(CHECKS_KEY)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("removes the saved parts when none are saved", () => {
    saveChecks(TEST_ID, { 1: PART_1 });
    saveChecks(TEST_ID, {});

    expect(localStorage.getItem(CHECKS_KEY)).toBeNull();
  });

  it("leaves out a part saved under another number or that is not a graded part, and reads broken JSON as none", () => {
    localStorage.setItem(CHECKS_KEY, JSON.stringify({ 1: PART_1, 2: PART_1, 3: { no: 3 } }));
    expect(loadChecks(TEST_ID)).toEqual({ 1: PART_1 });

    localStorage.setItem(CHECKS_KEY, "{");
    expect(loadChecks(TEST_ID)).toEqual({});
  });
});
