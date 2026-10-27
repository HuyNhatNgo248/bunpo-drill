import { describe, expect, it } from "vitest";
import { circled, questionAnchor, SECTION_TITLES, sectionInstruction } from "./sections";

describe("SECTION_TITLES", () => {
  it("names each section the way the JLPT paper does", () => {
    expect(SECTION_TITLES).toEqual({
      "fill-blank": "文法形式の判断",
      "sentence-order": "文の組み立て",
      passage: "文章の文法",
    });
  });
});

describe("sectionInstruction", () => {
  it("asks for the word in the blank in a fill-blank section", () => {
    expect(sectionInstruction("fill-blank")).toBe(
      "つぎの文の（　　）に入れるのに最もよいものを、1・2・3・4から一つえらびなさい。",
    );
  });

  it("asks for the ★ piece, and tells how to place a piece, in a sentence-order section", () => {
    expect(sectionInstruction("sentence-order")).toBe(
      "つぎの文の ★ に入る最もよいものを、1・2・3・4から一つえらびなさい。ピースを空欄にドラッグするか、タップして入れてください。",
    );
  });

  describe("a passage section", () => {
    it("names the one blank of a passage that has one", () => {
      expect(sectionInstruction("passage", [31])).toContain("（31）に入る最もよいもの");
    });

    it("names both blanks of a passage that has two", () => {
      expect(sectionInstruction("passage", [31, 32])).toContain("（31）と（32）の中に入る");
    });

    it("names the first and the last blank of a passage that has more", () => {
      expect(sectionInstruction("passage", [31, 32, 33, 34, 35])).toBe(
        "つぎの文章を読んで、文章全体の内容を考えて、（31）から（35）の中に入る最もよいものを、1・2・3・4から一つえらびなさい。",
      );
    });
  });
});

describe("circled", () => {
  it("writes 1 to 4 as the circled numbers of the 文法ノート", () => {
    expect([1, 2, 3, 4].map(circled)).toEqual(["①", "②", "③", "④"]);
  });

  it("writes a number with no circled form as plain digits", () => {
    expect(circled(5)).toBe("5");
    expect(circled(0)).toBe("0");
  });
});

describe("questionAnchor", () => {
  it("gives the element id of a question card", () => {
    expect(questionAnchor(12)).toBe("question-12");
  });
});
