import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildKanjiChapter, buildKanjiTestPayload, WORD_ID } from "#mocks/factories/kanji";
import { buildPayload } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser } from "#tests/helpers/session";
import { db } from "./db.server";
import {
  chapterLevels,
  getChapter,
  latestKanjiTests,
  learnedIds,
  listChapters,
  markLearned,
  saveChapter,
} from "./kanji.server";
import { createTest, saveSubmission } from "./tests.server";

const NOW = new Date("2026-10-31T09:00:00.000Z");

/** The user whose learned marks and results the tests read and write. */
const USER_ID = 1;

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
  await ensureUser(USER_ID);
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
    await markLearned(USER_ID, WORD_ID);

    await saveChapter(buildKanjiChapter({ title: "生活" }));

    expect((await getChapter("N2", 1))?.title).toBe("生活");
    expect(await learnedIds(USER_ID)).toEqual(new Set([WORD_ID]));
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
    await markLearned(USER_ID, WORD_ID);
    await markLearned(USER_ID, WORD_ID);

    expect(await learnedIds(USER_ID)).toEqual(new Set([WORD_ID]));
  });

  it("marks it for that user only", async () => {
    await ensureUser(2);

    await markLearned(USER_ID, WORD_ID);

    expect(await learnedIds(2)).toEqual(new Set());
  });
});

describe("latestKanjiTests", () => {
  it("gives each chapter's newest kanji test, with its score", async () => {
    await createKanjiTestAt("2026-10-30T09:00:00.000Z");
    const newer = await createKanjiTestAt("2026-10-31T09:00:00.000Z");
    const other = await createKanjiTestAt("2026-10-29T09:00:00.000Z", 2);
    await saveSubmission(USER_ID, newer.id, buildSubmission({ score: 1, total: 2, wrongGrammarIds: [WORD_ID] }));

    expect(await latestKanjiTests("N2", USER_ID)).toEqual(
      new Map([
        [1, { id: newer.id, result: { score: 1, total: 2 } }],
        [2, { id: other.id, result: null }],
      ]),
    );
  });

  it("gives another user's result on it as not taken", async () => {
    await ensureUser(2);
    const { id } = await createKanjiTestAt("2026-10-31T09:00:00.000Z");
    await saveSubmission(2, id, buildSubmission({ score: 1, total: 2, wrongGrammarIds: [WORD_ID] }));

    expect(await latestKanjiTests("N2", USER_ID)).toEqual(new Map([[1, { id, result: null }]]));
  });

  it("leaves out grammar tests and the tests of other levels", async () => {
    await createTest(buildPayload());
    await createTest(buildKanjiTestPayload({ level: "N3" }));

    expect(await latestKanjiTests("N2", USER_ID)).toEqual(new Map());
  });
});
