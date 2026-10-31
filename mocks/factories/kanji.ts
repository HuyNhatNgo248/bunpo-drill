import type { ChapterWord, KanjiChapter, KanjiQuestion, KanjiTestPayload } from "~/lib/kanji-payload";

/**
 * Builders for the kanji formats in app/lib/kanji-payload.ts.
 *
 * `buildKanjiChapter()` is the smallest chapter that the schema accepts: N2 1章 生活-1, one lesson (ギフト, p.20) with one
 * headword, 招, and its one word, 招待状. `buildKanjiTestPayload()` tests that word once in each 問題 (q1 漢字読み,
 * q2 表記). Each builder takes the fields to replace and fills the rest.
 */

type Headword = KanjiChapter["lessons"][number]["kanji"][number];
type Lesson = KanjiChapter["lessons"][number];
type ReadingSection = KanjiTestPayload["sections"][0];
type WritingSection = KanjiTestPayload["sections"][1];

/** The id of 招待状 in N2 1章: the word every built question tests. */
export const WORD_ID = "n2-c1-招待状";

export function buildChapterWord(overrides: Partial<ChapterWord> = {}): ChapterWord {
  return { word: "招待状", reading: "しょうたいじょう", meaning: "invitation card", ...overrides };
}

export function buildHeadword(overrides: Partial<Headword> = {}): Headword {
  return { char: "招", strokes: 8, kun: ["まね-く"], on: ["ショウ"], words: [buildChapterWord()], ...overrides };
}

export function buildLesson(overrides: Partial<Lesson> = {}): Lesson {
  return { title: "ギフト", page: 20, kanji: [buildHeadword()], ...overrides };
}

/**
 * @example
 * buildKanjiChapter({ chapter: 2 }).chapter; // -> 2
 */
export function buildKanjiChapter(overrides: Partial<KanjiChapter> = {}): KanjiChapter {
  return {
    version: 1,
    level: "N2",
    chapter: 1,
    title: "生活-1",
    lessons: [buildLesson()],
    otherKanji: [
      { char: "待", kun: ["ま-つ"], on: ["タイ"] },
      { char: "状", kun: [], on: ["ジョウ"] },
    ],
    ...overrides,
  };
}

/** 漢字読み on 招待状. The correct choice is 3 (index 2). */
export function buildKanjiReadingQuestion(overrides: Partial<KanjiQuestion> = {}): KanjiQuestion {
  return {
    id: "q1",
    wordId: WORD_ID,
    prompt: "取引先から新年会の【招待状】をいただいた。",
    choices: ["しょたいじょう", "しょだいじょう", "しょうたいじょう", "しょうだいじょう"],
    answerIndex: 2,
    ...overrides,
  };
}

/** 表記 on 招待状. The correct choice is 1 (index 0). */
export function buildKanjiWritingQuestion(overrides: Partial<KanjiQuestion> = {}): KanjiQuestion {
  return {
    id: "q2",
    wordId: WORD_ID,
    prompt: "友人に結婚式の【しょうたいじょう】を送った。",
    choices: ["招待状", "招持状", "紹待状", "紹持状"],
    answerIndex: 0,
    ...overrides,
  };
}

export function buildReadingSection(overrides: Partial<ReadingSection> = {}): ReadingSection {
  return { type: "kanji-reading", questions: [buildKanjiReadingQuestion()], ...overrides };
}

export function buildWritingSection(overrides: Partial<WritingSection> = {}): WritingSection {
  return { type: "kanji-writing", questions: [buildKanjiWritingQuestion()], ...overrides };
}

/**
 * @example
 * buildKanjiTestPayload({ title: "1章" }).title; // -> "1章"
 */
export function buildKanjiTestPayload(overrides: Partial<KanjiTestPayload> = {}): KanjiTestPayload {
  return {
    version: 1,
    kind: "kanji",
    title: "1章 生活-1",
    level: "N2",
    chapter: 1,
    words: [{ id: WORD_ID, word: "招待状", reading: "しょうたいじょう" }],
    sections: [buildReadingSection(), buildWritingSection()],
    ...overrides,
  };
}
