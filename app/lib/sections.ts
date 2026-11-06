import type { I18n, MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import type { SectionType } from "./payload";
import type { ReadingType, Trap } from "./reading-payload";

export const PASS_PERCENT = 80;

/** The official names of the 問題, in Japanese in every language: they are what the exam prints. */
export const SECTION_TITLES: Record<SectionType, string> = {
  "fill-blank": "文法形式の判断",
  "sentence-order": "文の組み立て",
  passage: "文章の文法",
  "kanji-reading": "漢字読み",
  "kanji-writing": "表記",
  "reading-short": "内容理解（短文）",
  "reading-mid": "内容理解（中文）",
  "reading-long": "内容理解（長文）",
  "reading-integrated": "統合理解",
  "reading-claim": "主張理解（長文）",
  "reading-info": "情報検索",
};

/** The reading page's groups, by the short names the exam's 問題 go by, in Japanese in every language. */
export const READING_GROUP_TITLES: Record<ReadingType | "mixed", string> = {
  "reading-short": "短文",
  "reading-mid": "中文",
  "reading-long": "長文",
  "reading-integrated": "統合理解",
  "reading-claim": "主張理解",
  "reading-info": "情報検索",
  mixed: "総合",
};

/** How a wrong reading choice was built, as the results name it under a missed question. */
export const TRAP_LABELS: Record<Trap, MessageDescriptor> = {
  "changed-detail": msg`Trap: one detail changed`,
  opposite: msg`Trap: the opposite of the text`,
  "not-in-text": msg`Trap: not in the text`,
  "true-not-answer": msg`Trap: true, but not the answer`,
  "over-general": msg`Trap: goes too far`,
  "missed-condition": msg`Trap: misses a condition`,
};

/** What each official name means, shown beside it on a page that is not Japanese. */
export const SECTION_GLOSSES: Record<SectionType, MessageDescriptor> = {
  "fill-blank": msg`Grammar form`,
  "sentence-order": msg`Sentence order`,
  passage: msg`Grammar in a passage`,
  "kanji-reading": msg`Kanji reading`,
  "kanji-writing": msg`Writing in kanji`,
  "reading-short": msg`Short passages`,
  "reading-mid": msg`Mid-length passages`,
  "reading-long": msg`Long passages`,
  "reading-integrated": msg`Two texts compared`,
  "reading-claim": msg`The writer's argument`,
  "reading-info": msg`Finding information`,
};

/** The English meaning of a 問題's name, or null on a Japanese page, where the name speaks for itself. */
export const sectionGloss = (i18n: I18n, type: SectionType) =>
  i18n.locale === "ja" ? null : i18n._(SECTION_GLOSSES[type]);

/** The instruction above a 問題. In Japanese it is the exam's own wording. */
export function sectionInstruction(
  type: SectionType,
  blankNums: number[] = [],
): MessageDescriptor {
  switch (type) {
    case "fill-blank":
      return msg`Choose the best answer for （　　） from 1, 2, 3 and 4.`;
    case "sentence-order":
      return msg`Choose the best piece for ★ from 1, 2, 3 and 4. Drag a piece into a slot, or tap it.`;
    case "passage": {
      const first = blankNums[0];
      const last = blankNums[blankNums.length - 1];
      if (blankNums.length <= 1) {
        return msg`Read the passage, think about what it says as a whole, and choose the best answer for （${first}） from 1, 2, 3 and 4.`;
      }
      return blankNums.length === 2
        ? msg`Read the passage, think about what it says as a whole, and choose the best answer for （${first}） and （${last}） from 1, 2, 3 and 4.`
        : msg`Read the passage, think about what it says as a whole, and choose the best answer for each of （${first}） to （${last}） from 1, 2, 3 and 4.`;
    }
    case "kanji-reading":
      return msg`Choose the best reading for the underlined word from 1, 2, 3 and 4.`;
    case "kanji-writing":
      return msg`Choose the best way to write the underlined word in kanji from 1, 2, 3 and 4.`;
    case "reading-short":
    case "reading-mid":
    case "reading-long":
    case "reading-claim":
      return msg`Read each passage, then choose the best answer to each question from 1, 2, 3 and 4.`;
    case "reading-integrated":
      return msg`Read texts A and B, then choose the best answer to each question from 1, 2, 3 and 4.`;
    case "reading-info":
      return msg`Read the information, then choose the best answer to each question from 1, 2, 3 and 4.`;
  }
}

const CIRCLED = ["①", "②", "③", "④"];

/** 第2週 in Japanese, "Week 2" in English: the 文法ノート's week headings. Pass `i18n` from useLingui. */
export const weekLabel = (i18n: I18n, week: number) =>
  i18n._(msg`Week ${week}`);

/** 3日目 in Japanese, "Day 3" in English. */
export const dayLabel = (i18n: I18n, day: number) => i18n._(msg`Day ${day}`);

/** 2 → "②", the way the 文法ノート number the points within a day. */
export function circled(number: number) {
  return CIRCLED[number - 1] ?? String(number);
}

/** "生活-1（p.20–24）" → "生活 ①": a chapter or lesson title without its pages, and the book's part number (-1 or 1) circled. */
export const chapterTitle = (title: string) =>
  title.split("（")[0].replace(/-?(\d+)$/, (_, part) => ` ${circled(Number(part))}`);

/** Element id of a quiz question card, used by the question list to jump to it. */
export const questionAnchor = (num: number) => `question-${num}`;

/** Element id of a passage card, by the number of its first blank, so a note's link can go back to it. */
export function passageAnchor(segments: { kind: string; num?: number }[]): string | undefined {
  const first = segments.find((segment) => segment.kind === "blank")?.num;
  return first === undefined ? undefined : `passage-${first}`;
}
