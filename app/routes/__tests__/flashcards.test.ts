import { beforeEach, describe, expect, it } from "vitest";
import { buildChapterWord, buildHeadword, buildKanjiChapter, buildLesson, WORD_ID } from "#mocks/factories/kanji";
import { resetDatabase } from "#tests/helpers/db";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { learnedIds, markLearned, saveChapter } from "~/lib/kanji.server";
import { action, loader, meta, shouldRevalidate } from "../flashcards";

/** 1章 with 招待状 and 招く, both under 招. */
const CHAPTER = buildKanjiChapter({
  lessons: [buildLesson({ kanji: [buildHeadword({ words: [buildChapterWord(), buildChapterWord({ word: "招く", reading: "まねく", meaning: "to invite" })] })] })],
});

const cardsUrl = (level = "N2", chapter = "1", search = "") => `https://bunpo.test/kanji/${level}/${chapter}/cards${search}`;

/** Runs the loader for the cards of `level` `chapter`. */
const load = (level?: string, chapter?: string, search?: string) =>
  loader(routeArgs<Parameters<typeof loader>[0]>(new Request(cardsUrl(level, chapter, search)), { level: level ?? "N2", chapter: chapter ?? "1" }));

/** Marks a card learned the way the session does: its word id as JSON. */
function send(body: string) {
  const request = new Request(cardsUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body });
  return action(routeArgs<Parameters<typeof action>[0]>(request, { level: "N2", chapter: "1" }));
}

beforeEach(async () => {
  await resetDatabase();
  await saveChapter(CHAPTER);
});

describe("flashcards loader", () => {
  it("gives the chapter's words that are not learned yet, as cards", async () => {
    await markLearned(WORD_ID);

    const { cards } = await load();

    expect(cards).toMatchObject({ level: "N2", chapter: 1, title: "生活-1", words: 2, learned: 1 });
    expect(cards.cards.map((card) => card.word)).toEqual(["招く"]);
  });

  it("gives only the words in ?words=, a quiz's misses", async () => {
    const { cards } = await load("N2", "1", `?words=${encodeURIComponent(WORD_ID)}`);

    expect(cards.cards.map((card) => card.word)).toEqual(["招待状"]);
  });

  describe("finding the chapter", () => {
    it("throws a 404 for a chapter that is not saved, or a level or chapter that is not one", async () => {
      for (const [level, chapter] of [
        ["N2", "2"],
        ["N9", "1"],
        ["N2", "one"],
      ]) {
        expect(await thrownBy(() => load(level, chapter))).toMatchObject({ data: "Chapter not found", init: { status: 404 } });
      }
    });
  });
});

describe("flashcards action", () => {
  it("marks a word of the chapter learned", async () => {
    expect(await send(JSON.stringify({ wordId: WORD_ID }))).toEqual({ learned: WORD_ID });
    expect(await learnedIds()).toEqual(new Set([WORD_ID]));
  });

  it("answers 400 for a body that is not a word of the chapter, and marks nothing", async () => {
    for (const body of ["not json", JSON.stringify({ wordId: "n2-c2-招待状" })]) {
      expect(await send(body)).toMatchObject({ init: { status: 400 } });
    }
    expect(await learnedIds()).toEqual(new Set());
  });
});

describe("flashcards shouldRevalidate", () => {
  it("keeps the session's cards after a card is marked learned, and loads them again on a visit", () => {
    const args = (formMethod?: "POST") => ({ formMethod, defaultShouldRevalidate: true }) as Parameters<typeof shouldRevalidate>[0];

    expect([shouldRevalidate(args("POST")), shouldRevalidate(args())]).toEqual([false, true]);
  });
});

describe("flashcards meta", () => {
  it("names the page after the chapter", () => {
    expect(meta(metaArgs<Parameters<typeof meta>[0]>({ loaderData: { cards: { title: "生活-1" } } }))).toEqual([
      { title: "生活-1 · Flashcards · 文法ドリル" },
    ]);
  });
});
