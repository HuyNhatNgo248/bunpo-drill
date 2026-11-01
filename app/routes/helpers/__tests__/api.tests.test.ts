import { beforeEach, describe, expect, it } from "vitest";
import { buildChapterWord, buildHeadword, buildKanjiChapter, buildKanjiTestPayload, buildLesson } from "#mocks/factories/kanji";
import { buildPayload } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { API_TOKEN } from "#tests/helpers/env";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { routeArgs } from "#tests/helpers/route";
import { saveChapter } from "~/lib/kanji.server";
import { createTest, getTest, listTests, saveSubmission } from "~/lib/tests.server";
import { action, loader } from "../api.tests";

/** The signed-in user, whose progress the routes read and write. */
const USER_ID = 1;

const URL = "https://bunpo.test/api/tests";

type ActionArgs = Parameters<typeof action>[0];

/** Sends `body` to the action with `method`. A string body goes as it is, anything else as JSON. */
async function send(method: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);
  return action(routeArgs<ActionArgs>(await signedInRequest(USER_ID, URL, init)));
}

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("GET /api/tests", () => {
  const get = (request: Request) => loader(routeArgs<Parameters<typeof loader>[0]>(request));

  it("gives the signed-in user's results, not another user's", async () => {
    const { id } = await createTest(buildPayload());
    await ensureUser(2);
    await saveSubmission(2, id, buildSubmission());

    const { tests } = await (await get(await signedInRequest(USER_ID, URL))).json();

    expect(tests).toEqual([expect.objectContaining({ id, result: null })]);
  });

  it("gives the owner's results, the oldest account's, to the quiz skill's token", async () => {
    const { id } = await createTest(buildPayload());
    await ensureUser(2);
    await saveSubmission(USER_ID, id, buildSubmission({ score: 1, total: 3 }));

    const response = await get(new Request(URL, { headers: { Authorization: `Bearer ${API_TOKEN}` } }));

    expect((await response.json()).tests).toEqual([expect.objectContaining({ id, result: { score: 1, total: 3, percent: 33 } })]);
  });

  it("lists every saved test as a summary", async () => {
    const { id } = await createTest(buildPayload());

    const response = await loader(routeArgs<Parameters<typeof loader>[0]>(await signedInRequest(USER_ID, URL)));

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
    expect(await listTests(USER_ID)).toHaveLength(1);
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
    expect((await getTest((await response.json()).id, USER_ID))?.payload).toEqual(buildKanjiTestPayload());
  });

  describe("checking the payload", () => {
    it("answers 400 with every issue, and saves nothing", async () => {
      const response = await send("POST", buildPayload({ title: "" }));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Invalid payload.",
        issues: [{ path: "title", message: expect.any(String) }],
      });
      expect(await listTests(USER_ID)).toEqual([]);
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

describe("another method", () => {
  it("answers 405 and names the methods it allows", async () => {
    const response = await send("DELETE");

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST");
  });
});
