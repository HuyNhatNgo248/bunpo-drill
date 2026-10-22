import type { SectionType } from "./payload";

export const PASS_PERCENT = 80;

export const SECTION_TITLES: Record<SectionType, string> = {
  "fill-blank": "文法形式の判断",
  "sentence-order": "文の組み立て",
  passage: "文章の文法",
};

export function sectionInstruction(type: SectionType, blankNums: number[] = []) {
  switch (type) {
    case "fill-blank":
      return "つぎの文の（　　）に入れるのに最もよいものを、1・2・3・4から一つえらびなさい。";
    case "sentence-order":
      return "つぎの文の ★ に入る最もよいものを、1・2・3・4から一つえらびなさい。ピースを空欄にドラッグするか、タップして入れてください。";
    case "passage": {
      const first = blankNums[0];
      const last = blankNums[blankNums.length - 1];
      const range =
        blankNums.length <= 1
          ? `（${first}）に`
          : blankNums.length === 2
            ? `（${first}）と（${last}）の中に`
            : `（${first}）から（${last}）の中に`;
      return `つぎの文章を読んで、文章全体の内容を考えて、${range}入る最もよいものを、1・2・3・4から一つえらびなさい。`;
    }
  }
}

const CIRCLED = ["①", "②", "③", "④"];

/** 2 → "②", the way the 文法ノート number the points within a day. */
export function circled(number: number) {
  return CIRCLED[number - 1] ?? String(number);
}

/** Element id of a quiz question card, used by the question list to jump to it. */
export const questionAnchor = (num: number) => `question-${num}`;
