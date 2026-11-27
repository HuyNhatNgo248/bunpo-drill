import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { seriesList } from "./seriesList";

const test = (id: string, title: string) => buildTestSummary({ id, title });

describe("seriesList", () => {
  it("groups tests named alike but for their number, by that number, in the order of their first test", () => {
    const tests = [test("a", "第1〜8週 まとめ 2/10"), test("b", "第1〜8週 総合 2"), test("c", "第1〜8週 総合 1"), test("d", "第1〜8週 まとめ 1/10")];

    const { series, rest } = seriesList(tests);

    expect(series.map((one) => [one.name, one.tests.map(({ test, number }) => `${test.id}${number}`)])).toEqual([
      ["第1〜8週 まとめ", ["d1", "a2"]],
      ["第1〜8週 総合", ["c1", "b2"]],
    ]);
    expect(rest).toEqual([]);
  });

  it("leaves the tests with no number at the end, or alone in their name, as they came", () => {
    const tests = [test("a", "第1〜4週 90問"), test("b", "第3〜5週"), test("c", "模試 1"), test("d", "総合 1"), test("e", "総合 2")];

    const { series, rest } = seriesList(tests);

    expect(series.map((one) => one.name)).toEqual(["総合"]);
    expect(rest.map((one) => one.id)).toEqual(["a", "b", "c"]);
  });
});
