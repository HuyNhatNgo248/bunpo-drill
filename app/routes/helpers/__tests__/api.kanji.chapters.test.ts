import { beforeEach, describe, expect, it } from "vitest";
import { buildKanjiChapter } from "#mocks/factories/kanji";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { getChapter, listChapters, saveChapter } from "~/lib/kanji.server";
import { action } from "../api.kanji.chapters";

const URL = "https://bunpo.test/api/kanji/chapters";

type ActionArgs = Parameters<typeof action>[0];

/** Sends `body` to the action with `method`. A string body goes as it is, anything else as JSON. */
function send(method: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);
  return action(routeArgs<ActionArgs>(new Request(URL, init)));
}

beforeEach(resetDatabase);

describe("POST /api/kanji/chapters", () => {
  it("saves a valid chapter and answers 201 with its word count and its flashcards URL", async () => {
    const response = await send("POST", buildKanjiChapter());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ level: "N2", chapter: 1, words: 1, url: "https://bunpo.test/kanji/N2/1/cards" });
    expect(response.headers.get("Location")).toBe("https://bunpo.test/kanji/N2/1/cards");
    expect(await getChapter("N2", 1)).toEqual(buildKanjiChapter());
  });

  describe("reading the body", () => {
    it("answers 400 for a body that is not JSON", async () => {
      const response = await send("POST", "not json");

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Body must be JSON." });
    });
  });

  describe("checking the chapter", () => {
    it("answers 400 with every issue, and saves nothing", async () => {
      const response = await send("POST", buildKanjiChapter({ title: "" }));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid chapter.", issues: [{ path: "title", message: expect.any(String) }] });
      expect(await getChapter("N2", 1)).toBeNull();
    });
  });
});

describe("PATCH /api/kanji/chapters", () => {
  it("saves the level's order and answers with the chapters it ordered", async () => {
    await saveChapter(buildKanjiChapter({ chapter: 1 }));
    await saveChapter(buildKanjiChapter({ chapter: 2 }));

    const response = await send("PATCH", { level: "N2", order: [2, 1, 9] });

    expect(await response.json()).toEqual({ order: [2, 1] });
    expect((await listChapters("N2")).map((chapter) => chapter.chapter)).toEqual([2, 1]);
  });

  it("answers 400 for a body without a level and an order", async () => {
    const response = await send("PATCH", { order: [1] });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Body must be {"level": "N2", "order": number[]}.' });
  });
});

describe("another method", () => {
  it("answers 405 and names the methods it allows", async () => {
    const response = await send("PUT", {});

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST, PATCH");
  });
});
