import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { visibleTests, type PendingChanges } from "./visibleTests";

const FIRST = buildTestSummary({ id: "20261027-aaaaaa" });
const SECOND = buildTestSummary({ id: "20261027-bbbbbb" });
const THIRD = buildTestSummary({ id: "20261027-cccccc" });

const NOTHING_PENDING: PendingChanges = { deleting: new Set(), order: null };

const idsOf = (tests: { id: string }[]) => tests.map((test) => test.id);

describe("visibleTests", () => {
  it("shows the saved tests as they are while nothing saves", () => {
    expect(visibleTests([FIRST, SECOND], NOTHING_PENDING)).toEqual([FIRST, SECOND]);
  });

  it("hides a test that is being deleted", () => {
    expect(idsOf(visibleTests([FIRST, SECOND], { ...NOTHING_PENDING, deleting: new Set([FIRST.id]) }))).toEqual([SECOND.id]);
  });

  it("puts the tests in the order that is saving", () => {
    const pending = { ...NOTHING_PENDING, order: [THIRD.id, FIRST.id, SECOND.id] };

    expect(idsOf(visibleTests([FIRST, SECOND, THIRD], pending))).toEqual([THIRD.id, FIRST.id, SECOND.id]);
  });

  it("leaves the saved list as it was", () => {
    const saved = [FIRST, SECOND];

    visibleTests(saved, { ...NOTHING_PENDING, order: [SECOND.id, FIRST.id] });

    expect(saved).toEqual([FIRST, SECOND]);
  });
});
