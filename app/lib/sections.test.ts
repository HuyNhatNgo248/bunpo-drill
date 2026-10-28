import { i18n } from "@lingui/core";
import { describe, expect, it } from "vitest";
import { getServerI18n } from "~/lib/i18n/catalogs.server";
import { circled, questionAnchor, SECTION_TITLES, sectionGloss, sectionInstruction } from "./sections";

/** An instruction in English, the language of the tests. */
const instruction = (...args: Parameters<typeof sectionInstruction>) => i18n._(sectionInstruction(...args));

describe("SECTION_TITLES", () => {
  it("names each section the way the JLPT paper does, in Japanese in every language", () => {
    expect(SECTION_TITLES).toEqual({
      "fill-blank": "文法形式の判断",
      "sentence-order": "文の組み立て",
      passage: "文章の文法",
    });
  });
});

describe("sectionGloss", () => {
  it("says what a section's name means on an English page", () => {
    expect(sectionGloss(i18n, "fill-blank")).toBe("Grammar form");
  });

  it("gives nothing on a Japanese page, where the name speaks for itself", () => {
    expect(sectionGloss(getServerI18n("ja"), "fill-blank")).toBeNull();
  });
});

describe("sectionInstruction", () => {
  it("asks for the word in the blank in a fill-blank section", () => {
    expect(instruction("fill-blank")).toBe("Choose the best answer for （　　） from 1, 2, 3 and 4.");
  });

  it("asks for the ★ piece, and tells how to place a piece, in a sentence-order section", () => {
    expect(instruction("sentence-order")).toBe(
      "Choose the best piece for ★ from 1, 2, 3 and 4. Drag a piece into a slot, or tap it.",
    );
  });

  describe("a passage section", () => {
    it("names the one blank of a passage that has one", () => {
      expect(instruction("passage", [31])).toContain("the best answer for （31） from");
    });

    it("names both blanks of a passage that has two", () => {
      expect(instruction("passage", [31, 32])).toContain("（31） and （32）");
    });

    it("names the first and the last blank of a passage that has more", () => {
      expect(instruction("passage", [31, 32, 33, 34, 35])).toContain("each of （31） to （35）");
    });

    it("keeps the exam's own wording in Japanese", () => {
      expect(getServerI18n("ja")._(sectionInstruction("passage", [31, 32, 33, 34, 35]))).toBe(
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
