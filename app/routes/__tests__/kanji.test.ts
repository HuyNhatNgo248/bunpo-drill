import { beforeEach, describe, expect, it } from "vitest";
import { buildKanjiChapter, buildKanjiTestPayload, WORD_ID } from "#mocks/factories/kanji";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { markLearned, saveChapter } from "~/lib/kanji.server";
import { createTest, saveSubmission } from "~/lib/tests.server";
import { loader, meta } from "../kanji";

/** Runs the loader for /kanji with `search`. */
const load = (search = "") => loader(routeArgs<Parameters<typeof loader>[0]>(new Request(`https://bunpo.test/kanji${search}`)));

beforeEach(resetDatabase);

describe("kanji loader", () => {
  it("sums up each chapter of the level, with its newest quiz, and the figures over them", async () => {
    await saveChapter(buildKanjiChapter());
    await markLearned(WORD_ID);
    const { id } = await createTest(buildKanjiTestPayload());
    await saveSubmission(id, buildSubmission({ score: 1, total: 2 }));

    expect((await load("?level=N2")).home).toEqual({
      level: "N2",
      chapters: [{ chapter: 1, title: "生活-1", words: 1, learned: 1, quiz: { id, result: { score: 1, total: 2 } } }],
      stats: { learned: 1, words: 1, average: 50, missed: 0 },
    });
  });

  it("opens the hardest level that has a chapter when none is asked for, else N2", async () => {
    expect((await load()).home.level).toBe("N2");

    await saveChapter(buildKanjiChapter({ level: "N3" }));

    expect((await load()).home.level).toBe("N3");
  });

  it("gives an empty page for a level without kanji tests, such as N5", async () => {
    await saveChapter(buildKanjiChapter());

    expect((await load("?level=N5")).home).toEqual({ level: "N5", chapters: [], stats: { learned: 0, words: 0, average: null, missed: 0 } });
  });
});

describe("kanji meta", () => {
  it("names the page in the page's language", () => {
    expect(meta(metaArgs<Parameters<typeof meta>[0]>({ locale: "ja" }))).toEqual([{ title: "漢字 · 文法ドリル" }]);
  });
});
