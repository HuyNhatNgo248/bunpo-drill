import { beforeEach, describe, expect, it } from "vitest";
import { buildKanjiChapter, buildKanjiTestPayload, WORD_ID } from "#mocks/factories/kanji";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { markLearned, saveChapter } from "~/lib/kanji.server";
import type { Tab } from "~/lib/lastTab";
import { createTest, saveSubmission } from "~/lib/tests.server";
import { lastTabOf, saveLastTab } from "~/lib/users.server";
import { loader, meta } from "../kanji";

/** The signed-in user, whose progress the routes read and write. */
const USER_ID = 1;

/** Runs the loader for /kanji with `search`. */
const load = async (search = "") => loader(routeArgs<Parameters<typeof loader>[0]>(await signedInRequest(USER_ID, `https://bunpo.test/kanji${search}`)));

/** The loader for /kanji with `search`, for a user whose last tab, on any device, was `tab`. */
async function loadAfter(tab: Tab, search = "") {
  await saveLastTab(USER_ID, tab);
  return load(search);
}

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("kanji loader", () => {
  it("sums up each chapter of the level, with its newest quiz, and the figures over them", async () => {
    await saveChapter(buildKanjiChapter());
    await markLearned(USER_ID, WORD_ID);
    const { id } = await createTest(buildKanjiTestPayload());
    await saveSubmission(USER_ID, id, buildSubmission({ score: 1, total: 2 }));

    expect((await load("?level=N2")).home).toEqual({
      level: "N2",
      chapters: [{ chapter: 1, title: "生活-1", words: 1, learned: 1, quiz: { id, result: { score: 1, total: 2 } } }],
      stats: { learned: 1, words: 1, average: 50, missed: 0 },
    });
  });

  it("opens the hardest level that has a chapter when none is asked for and none was opened before", async () => {
    await saveChapter(buildKanjiChapter({ level: "N3" }));

    const data = await load();

    expect(data.home.level).toBe("N3");
    expect(data.level).toBe("N3");
  });

  it("opens N2, the book's level, when no level has a chapter yet", async () => {
    expect((await load()).home.level).toBe("N2");
  });

  it("opens the kanji level the user last opened when none is asked for, but not a grammar one", async () => {
    expect((await loadAfter({ subject: "kanji", level: "N3" })).home.level).toBe("N3");
    expect((await loadAfter({ subject: "grammar", level: "N3" })).home.level).toBe("N2");
    expect((await loadAfter({ subject: "kanji", level: "N3" }, "?level=N2")).home.level).toBe("N2");
  });

  it("saves the level it shows as the user's last tab", async () => {
    await load("?level=N5");

    await expect.poll(() => lastTabOf(USER_ID)).toEqual({ subject: "kanji", level: "N5" });
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
