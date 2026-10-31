import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildKanjiChapter, buildKanjiTestPayload, WORD_ID } from "#mocks/factories/kanji";
import { buildPayload } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { db } from "./db.server";
import {
  chapterLevels,
  getChapter,
  latestKanjiTests,
  learnedIds,
  listChapters,
  markLearned,
  saveChapter,
  saveChapterOrder,
} from "./kanji.server";
import { createTest, saveSubmission } from "./tests.server";

const NOW = new Date("2026-10-31T09:00:00.000Z");

/**
 * Saves a kanji test at the given instant, so a test can control which one is newer. createTest saves any payload, and
 * latestKanjiTests reads only its kind, level and chapter, so the word ids may not match `chapter`.
 */
async function createKanjiTestAt(iso: string, chapter = 1) {
  vi.setSystemTime(new Date(iso));
  return createTest(buildKanjiTestPayload({ chapter }));
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("saveChapter", () => {
  it("saves a chapter, which getChapter reads back", async () => {
    await saveChapter(buildKanjiChapter());

    expect(await getChapter("N2", 1)).toEqual(buildKanjiChapter());
  });

  it("replaces a chapter sent again, and keeps its words' learned marks", async () => {
    await saveChapter(buildKanjiChapter());
    await markLearned(WORD_ID);

    await saveChapter(buildKanjiChapter({ title: "生活" }));

    expect((await getChapter("N2", 1))?.title).toBe("生活");
    expect(await learnedIds()).toEqual(new Set([WORD_ID]));
  });
});

describe("getChapter", () => {
  it("returns null for a chapter that is not saved", async () => {
    expect(await getChapter("N2", 1)).toBeNull();
  });

  it("skips a row that is not a chapter, instead of failing", async () => {
    await (await db()).execute({ sql: "INSERT INTO kanji_chapters (level, chapter, payload, updated_at) VALUES ('N2', 1, 'not json', ?)", args: [NOW.toISOString()] });

    expect(await getChapter("N2", 1)).toBeNull();
  });
});

describe("listChapters", () => {
  it("lists a level's chapters, first chapter first", async () => {
    await saveChapter(buildKanjiChapter({ chapter: 2 }));
    await saveChapter(buildKanjiChapter({ chapter: 1 }));
    await saveChapter(buildKanjiChapter({ level: "N3", chapter: 3 }));

    expect((await listChapters("N2")).map((chapter) => chapter.chapter)).toEqual([1, 2]);
  });

  it("lists the chapters dragged into place first, in that order, then the ones sent since", async () => {
    for (const chapter of [1, 2, 3]) await saveChapter(buildKanjiChapter({ chapter }));
    await saveChapterOrder("N2", [3, 1]);
    await saveChapter(buildKanjiChapter({ chapter: 4 }));

    expect((await listChapters("N2")).map((chapter) => chapter.chapter)).toEqual([3, 2, 1, 4]);
  });
});

describe("saveChapterOrder", () => {
  it("orders the chapters given among the places they hold, and answers with the saved ones", async () => {
    for (const chapter of [1, 2, 3]) await saveChapter(buildKanjiChapter({ chapter }));

    expect(await saveChapterOrder("N2", [2, 1, 9, 2])).toEqual([2, 1]);
    expect((await listChapters("N2")).map((chapter) => chapter.chapter)).toEqual([2, 1, 3]);
  });

  it("leaves the other levels' chapters where they are", async () => {
    await saveChapter(buildKanjiChapter({ chapter: 1 }));
    await saveChapter(buildKanjiChapter({ level: "N3", chapter: 1 }));
    await saveChapter(buildKanjiChapter({ level: "N3", chapter: 2 }));

    expect(await saveChapterOrder("N2", [1, 2])).toEqual([1]);
    expect((await listChapters("N3")).map((chapter) => chapter.chapter)).toEqual([1, 2]);
  });
});

describe("chapterLevels", () => {
  it("lists the levels that have a chapter, easiest first", async () => {
    await saveChapter(buildKanjiChapter({ level: "N2" }));
    await saveChapter(buildKanjiChapter({ level: "N3" }));

    expect(await chapterLevels()).toEqual(["N3", "N2"]);
  });
});

describe("markLearned", () => {
  it("marks a word learned, once however often it is marked", async () => {
    await markLearned(WORD_ID);
    await markLearned(WORD_ID);

    expect(await learnedIds()).toEqual(new Set([WORD_ID]));
  });
});

describe("latestKanjiTests", () => {
  it("gives each chapter's newest kanji test, with its score and the words it got wrong", async () => {
    await createKanjiTestAt("2026-10-30T09:00:00.000Z");
    const newer = await createKanjiTestAt("2026-10-31T09:00:00.000Z");
    const other = await createKanjiTestAt("2026-10-29T09:00:00.000Z", 2);
    await saveSubmission(newer.id, buildSubmission({ score: 1, total: 2, wrongGrammarIds: [WORD_ID] }));

    expect(await latestKanjiTests("N2")).toEqual(
      new Map([
        [1, { id: newer.id, result: { score: 1, total: 2 }, wrongIds: [WORD_ID] }],
        [2, { id: other.id, result: null, wrongIds: [] }],
      ]),
    );
  });

  it("leaves out grammar tests and the tests of other levels", async () => {
    await createTest(buildPayload());
    await createTest(buildKanjiTestPayload({ level: "N3" }));

    expect(await latestKanjiTests("N2")).toEqual(new Map());
  });
});
