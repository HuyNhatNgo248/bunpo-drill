import { describe, expect, it } from "vitest";
import { buildResultsView } from "#mocks/factories/views";
import { takeLocalDraft } from "./localDraft";

const TEST_ID = "20261028-abc123";
const KEY = `bunpo:answers:${TEST_ID}`;
const CHECKS_KEY = `bunpo:checked:${TEST_ID}`;

/** Part 1 of the test, graded. */
const PART_1 = buildResultsView().sections[0];

describe("takeLocalDraft", () => {
  it("takes the sheet and the checked parts this browser kept, once", () => {
    localStorage.setItem(KEY, JSON.stringify({ q1: 2, q2: [1, 0, null, null] }));
    localStorage.setItem(CHECKS_KEY, JSON.stringify({ 1: PART_1 }));

    expect(takeLocalDraft(TEST_ID)).toEqual({ answers: { q1: 2, q2: [1, 0, null, null] }, checks: { 1: PART_1 } });
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem(CHECKS_KEY)).toBeNull();
    expect(takeLocalDraft(TEST_ID)).toBeNull();
  });

  it("leaves out anything that is not an answer, or not a graded part under its own number", () => {
    localStorage.setItem(KEY, JSON.stringify({ q1: 2, q2: 7, q3: "a" }));
    localStorage.setItem(CHECKS_KEY, JSON.stringify({ 1: PART_1, 2: PART_1, 3: { no: 3 } }));

    expect(takeLocalDraft(TEST_ID)).toEqual({ answers: { q1: 2 }, checks: { 1: PART_1 } });
  });

  it("gives null when the browser kept nothing, or a sheet that is not JSON", () => {
    expect(takeLocalDraft(TEST_ID)).toBeNull();

    localStorage.setItem(KEY, "{");
    expect(takeLocalDraft(TEST_ID)).toBeNull();
  });
});
