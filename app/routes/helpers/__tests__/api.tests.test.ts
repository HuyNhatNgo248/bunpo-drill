import { beforeEach, describe, expect, it } from "vitest";
import { buildChapterWord, buildHeadword, buildKanjiChapter, buildKanjiTestPayload, buildLesson } from "#mocks/factories/kanji";
import { buildPayload } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { saveChapter } from "~/lib/kanji.server";
import { createTest, getTest, listTests } from "~/lib/tests.server";
import { action, loader } from "../api.tests";

const URL = "https://bunpo.test/api/tests";

type ActionArgs = Parameters<typeof action>[0];

/** Sends `body` to the action with `method`. A string body goes as it is, anything else as JSON. */
function send(method: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);
  return action(routeArgs<ActionArgs>(new Request(URL, init)));
}

beforeEach(resetDatabase);

describe("GET /api/tests", () => {
  it("lists every saved test as a summary", async () => {
    const { id } = await createTest(buildPayload());

    const response = await loader(routeArgs<Parameters<typeof loader>[0]>(new Request(URL)));

    expect(await response.json()).toEqual({
      tests: [expect.objectContaining({ id, title: "第1週 1日目", questionCount: 3, result: null })],
    });
  });
});

describe("POST /api/tests", () => {
  it("saves a valid payload and answers 201 with the id and the quiz URL", async () => {
    const response = await send("POST", buildPayload());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ id: expect.stringMatching(/^\d{8}-[0-9a-f]{6}$/), url: `https://bunpo.test/tests/${body.id}` });
    expect(response.headers.get("Location")).toBe(body.url);
    expect(await listTests()).toHaveLength(1);
  });

  describe("reading the body", () => {
    it("answers 400 for a body that is not JSON", async () => {
      const response = await send("POST", "not json");

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Body must be JSON." });
    });
  });

  it("saves a kanji test on a chapter that is saved", async () => {
    await saveChapter(buildKanjiChapter());

    const response = await send("POST", buildKanjiTestPayload());

    expect(response.status).toBe(201);
    expect((await getTest((await response.json()).id))?.payload).toEqual(buildKanjiTestPayload());
  });

  describe("checking the payload", () => {
    it("answers 400 with every issue, and saves nothing", async () => {
      const response = await send("POST", buildPayload({ title: "" }));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Invalid payload.",
        issues: [{ path: "title", message: expect.any(String) }],
      });
      expect(await listTests()).toEqual([]);
    });
  });

  describe("checking a kanji test against its chapter", () => {
    it("answers 400 when the chapter is not saved, so a miss would have no flashcard", async () => {
      const response = await send("POST", buildKanjiTestPayload());

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Invalid payload.",
        issues: [{ path: "chapter", message: "N2 chapter 1 isn't saved. POST it to /api/kanji/chapters first." }],
      });
    });

    it("answers 400 for a word that the chapter does not have, or reads another way", async () => {
      await saveChapter(buildKanjiChapter({ lessons: [buildLesson({ kanji: [buildHeadword({ words: [buildChapterWord({ reading: "しょうだいじょう" })] })] })] }));

      expect(await (await send("POST", buildKanjiTestPayload())).json()).toMatchObject({
        issues: [{ path: "words.0.reading", message: "The chapter reads 招待状 as しょうだいじょう." }],
      });

      await saveChapter(buildKanjiChapter({ lessons: [buildLesson({ kanji: [buildHeadword({ words: [buildChapterWord({ word: "招く", reading: "まねく" })] })] })] }));

      expect(await (await send("POST", buildKanjiTestPayload())).json()).toMatchObject({
        issues: [{ path: "words.0.id", message: '"招待状" is not a word of this chapter.' }],
      });
    });
  });
});

describe("PATCH /api/tests", () => {
  it("saves the order and answers with what it saved", async () => {
    const first = await createTest(buildPayload());
    const second = await createTest(buildPayload());

    const response = await send("PATCH", { order: [second.id, first.id, "not-an-id"] });

    expect(await response.json()).toEqual({ order: [second.id, first.id] });
  });

  it("answers 400 for a body without an order", async () => {
    const response = await send("PATCH", { ids: [] });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Body must be {"order": string[]}.' });
  });
});

describe("DELETE /api/tests", () => {
  it("deletes every test and answers with how many it deleted", async () => {
    await createTest(buildPayload());
    await createTest(buildPayload());

    expect(await (await send("DELETE")).json()).toEqual({ deleted: 2 });
    expect(await listTests()).toEqual([]);
  });
});

describe("another method", () => {
  it("answers 405 and names the methods it allows", async () => {
    const response = await send("PUT", {});

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST, PATCH, DELETE");
  });
});
