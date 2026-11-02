import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { matchOf } from "./searchTests";

const TEST = buildTestSummary({ title: "第3週 1〜3日目", patterns: ["〜あげく", "〜末に", "〜かと思ったら"] });

describe("matchOf", () => {
  it("matches the title, giving no patterns", () => {
    expect(matchOf(TEST, "3週")).toEqual([]);
    expect(matchOf(TEST, "第３週")).toEqual([]);
  });

  it("matches a grammar pattern, with or without its 〜, giving the patterns matched", () => {
    expect(matchOf(TEST, "あげく")).toEqual(["〜あげく"]);
    expect(matchOf(TEST, "〜末")).toEqual(["〜末に"]);
  });

  it("needs every word to match, in the title or a pattern", () => {
    expect(matchOf(TEST, "3週 あげく")).toEqual(["〜あげく"]);
    expect(matchOf(TEST, "あげく ばかりか")).toBeNull();
    expect(matchOf(TEST, "ばかりか")).toBeNull();
  });

  it("matches every test when the search is empty", () => {
    expect(matchOf(TEST, "  ")).toEqual([]);
  });
});
