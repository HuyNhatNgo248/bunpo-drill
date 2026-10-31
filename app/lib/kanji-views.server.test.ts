import { describe, expect, it } from "vitest";
import { buildChapterWord, buildHeadword, buildKanjiChapter, buildLesson, WORD_ID } from "#mocks/factories/kanji";
import { chapterWords, SESSION_SIZE, toFlashcards, toKanjiHome } from "./kanji-views.server";

/** 招 with 招待状 and 招く and a sentence, then 待 with 待合室: two lessons, in the book's order. */
const CHAPTER = buildKanjiChapter({
  lessons: [
    buildLesson({
      kanji: [
        buildHeadword({
          words: [buildChapterWord(), buildChapterWord({ word: "招く", reading: "まねく", meaning: "to invite" })],
          examples: [{ sentence: "友人を食事に【招いた】。", meaning: "I invited a friend to dinner." }],
        }),
      ],
    }),
    buildLesson({
      title: "待つ",
      page: 21,
      kanji: [buildHeadword({ char: "待", kun: ["ま-つ"], on: ["タイ"], words: [buildChapterWord({ word: "待合室", reading: "まちあいしつ", meaning: "waiting room" })] })],
    }),
  ],
  otherKanji: [
    { char: "状", kun: [], on: ["ジョウ"] },
    { char: "合", kun: ["あ-う"], on: ["ゴウ"] },
    { char: "室", kun: [], on: ["シツ"] },
  ],
});

describe("chapterWords", () => {
  it("lists every word in the book's order, with its id, its headword and its lesson", () => {
    expect(chapterWords(CHAPTER).map(({ id, headword, lesson }) => [id, headword, lesson])).toEqual([
      [WORD_ID, "招", { title: "ギフト", page: 20 }],
      ["n2-c1-招く", "招", { title: "ギフト", page: 20 }],
      ["n2-c1-待合室", "待", { title: "待つ", page: 21 }],
    ]);
  });
});

describe("toFlashcards", () => {
  it("gives the words not learned yet in the book's order, each with its kanji's readings and its headword's other words", () => {
    const view = toFlashcards(CHAPTER, new Set([WORD_ID]), undefined, null);

    expect(view).toMatchObject({ level: "N2", chapter: 1, title: "生活-1", words: 3, learned: 1, quiz: null });
    expect(view.cards.map((card) => card.wordId)).toEqual(["n2-c1-招く", "n2-c1-待合室"]);
    expect(view.cards[1]).toEqual({
      wordId: "n2-c1-待合室",
      word: "待合室",
      reading: "まちあいしつ",
      meaning: "waiting room",
      learned: false,
      lesson: { title: "待つ", page: 21 },
      kanji: [
        { char: "待", kun: ["ま-つ"], on: ["タイ"], strokes: 8 },
        { char: "合", kun: ["あ-う"], on: ["ゴウ"], strokes: null },
        { char: "室", kun: [], on: ["シツ"], strokes: null },
      ],
      headword: "待",
      related: [],
      examples: [],
    });
    expect(view.cards[0]?.related).toEqual([{ word: "招待状", reading: "しょうたいじょう" }]);
    expect(view.cards[0]?.examples).toEqual([{ sentence: { before: "友人を食事に", word: "招いた", after: "。" }, meaning: "I invited a friend to dinner." }]);
  });

  it("gives only the words asked for, a quiz's misses, learned or not", () => {
    const view = toFlashcards(CHAPTER, new Set([WORD_ID]), undefined, [WORD_ID, "n2-c1-ない"]);

    expect(view.cards.map((card) => [card.wordId, card.learned])).toEqual([[WORD_ID, true]]);
  });

  it("gives at most SESSION_SIZE cards", () => {
    const words = Array.from({ length: SESSION_SIZE + 5 }, (_, i) => buildChapterWord({ word: `招${"待".repeat(i + 1)}` }));
    const big = buildKanjiChapter({ lessons: [buildLesson({ kanji: [buildHeadword({ words })] })] });

    expect(toFlashcards(big, new Set(), undefined, null).cards).toHaveLength(SESSION_SIZE);
  });

  it("reviews the learned words once every word is learned", () => {
    const all = new Set(chapterWords(CHAPTER).map((word) => word.id));

    expect(toFlashcards(CHAPTER, all, undefined, null).cards.map((card) => card.wordId).sort()).toEqual([...all].sort());
  });

  it("gives the chapter's newest quiz", () => {
    expect(toFlashcards(CHAPTER, new Set(), { id: "20261031-aaaaaa", result: null, wrongIds: [] }, null).quiz).toEqual({
      id: "20261031-aaaaaa",
      result: null,
    });
  });
});

describe("toKanjiHome", () => {
  it("sums up each chapter, and the figures over the newest quizzes", () => {
    const latest = new Map([
      [1, { id: "20261031-aaaaaa", result: { score: 1, total: 2 }, wrongIds: [WORD_ID, "n2-c1-招く"] }],
      [2, { id: "20261031-bbbbbb", result: { score: 2, total: 2 }, wrongIds: [] }],
    ]);

    const home = toKanjiHome("N2", [CHAPTER, buildKanjiChapter({ chapter: 2 })], new Set([WORD_ID]), latest);

    expect(home.chapters).toEqual([
      { chapter: 1, title: "生活-1", words: 3, learned: 1, quiz: { id: "20261031-aaaaaa", result: { score: 1, total: 2 } } },
      { chapter: 2, title: "生活-1", words: 1, learned: 0, quiz: { id: "20261031-bbbbbb", result: { score: 2, total: 2 } } },
    ]);
    expect(home.stats).toEqual({ learned: 1, words: 4, average: 75, missed: 1 });
  });

  it("gives no average before a quiz is taken", () => {
    expect(toKanjiHome("N2", [CHAPTER], new Set(), new Map()).stats).toEqual({ learned: 0, words: 3, average: null, missed: 0 });
  });
});
