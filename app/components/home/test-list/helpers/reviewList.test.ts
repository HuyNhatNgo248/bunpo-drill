import { describe, expect, it } from "vitest";
import { buildReviewChip, buildTestSummary } from "#mocks/factories/views";
import { reviewList } from "./reviewList";

const BAKARIKA = buildReviewChip({ grammarId: "n2-w3-d2-g4", pattern: "〜ばかりか", week: 3, day: 2, number: 4 });

const MONONO = buildReviewChip({ grammarId: "n2-w1-d5-g1", pattern: "〜ものの", week: 1, day: 5, number: 1 });

describe("reviewList", () => {
  it("lists the grammar of every test once per pattern, in the order of the 文法ノート, with the tests that got it wrong", () => {
    const list = reviewList([
      buildTestSummary({ id: "a", review: [BAKARIKA] }),
      buildTestSummary({ id: "b", review: [BAKARIKA, MONONO] }),
    ]);

    expect(list.map((item) => item.chip.pattern)).toEqual(["〜ものの", "〜ばかりか"]);
    expect(list[1]!.targets).toEqual([
      { testId: "a", grammarId: "n2-w3-d2-g4" },
      { testId: "b", grammarId: "n2-w3-d2-g4" },
    ]);
  });

  it("keeps a pattern to review until every test that got it wrong has it marked reviewed", () => {
    const reviewed = { ...BAKARIKA, reviewed: true };

    expect(reviewList([buildTestSummary({ id: "a", review: [reviewed] }), buildTestSummary({ id: "b", review: [BAKARIKA] })])[0]!.chip.reviewed).toBe(false);
    expect(reviewList([buildTestSummary({ id: "a", review: [reviewed] }), buildTestSummary({ id: "b", review: [reviewed] })])[0]!.chip.reviewed).toBe(true);
  });

  it("shows a pattern of two weeks at its first, and marks it under each id", () => {
    const later = { ...BAKARIKA, grammarId: "n2-w5-d1-g1", week: 5, day: 1, number: 1 };

    const [item] = reviewList([buildTestSummary({ id: "a", review: [later] }), buildTestSummary({ id: "b", review: [BAKARIKA] })]);

    expect(item!.chip.week).toBe(3);
    expect(item!.targets).toEqual([
      { testId: "a", grammarId: "n2-w5-d1-g1" },
      { testId: "b", grammarId: "n2-w3-d2-g4" },
    ]);
  });
});
