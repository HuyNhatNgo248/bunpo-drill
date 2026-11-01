import type { I18n, MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import type { SectionType } from "./payload";

export const PASS_PERCENT = 80;

/** The official names of the 問題, in Japanese in every language: they are what the exam prints. */
export const SECTION_TITLES: Record<SectionType, string> = {
  "fill-blank": "文法形式の判断",
  "sentence-order": "文の組み立て",
  passage: "文章の文法",
  "kanji-reading": "漢字読み",
  "kanji-writing": "表記",
};

/** What each official name means, shown beside it on a page that is not Japanese. */
export const SECTION_GLOSSES: Record<SectionType, MessageDescriptor> = {
  "fill-blank": msg`Grammar form`,
  "sentence-order": msg`Sentence order`,
  passage: msg`Grammar in a passage`,
  "kanji-reading": msg`Kanji reading`,
  "kanji-writing": msg`Writing in kanji`,
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
  }
}

const CIRCLED = ["①", "②", "③", "④"];

/** 第2週 in Japanese, "Week 2" in English: the 文法ノート's week headings. Pass `i18n` from useLingui. */
export const weekLabel = (i18n: I18n, week: number) =>
  i18n._(msg`Week ${week}`);

/** 1章 in Japanese, "Chapter 1" in English: the chapters of 漢字マスター. */
export const chapterLabel = (i18n: I18n, chapter: number) => i18n._(msg`Chapter ${chapter}`);

/** 3日目 in Japanese, "Day 3" in English. */
export const dayLabel = (i18n: I18n, day: number) => i18n._(msg`Day ${day}`);

/** 2 → "②", the way the 文法ノート number the points within a day. */
export function circled(number: number) {
  return CIRCLED[number - 1] ?? String(number);
}

/** Element id of a quiz question card, used by the question list to jump to it. */
export const questionAnchor = (num: number) => `question-${num}`;
