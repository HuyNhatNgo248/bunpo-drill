import { beforeEach, describe, expect, it } from "vitest";
import { buildKanjiTestPayload, WORD_ID } from "#mocks/factories/kanji";
import { buildPayload } from "#mocks/factories/payload";
import { learnedIds, markLearned } from "~/lib/kanji.server";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { buildSubmission } from "#mocks/factories/tests";
import { createTest, getTest, saveSubmission } from "~/lib/tests.server";
import { action, loader, meta } from "../quiz";

const UNKNOWN_ID = "20261027-000000";

const quizUrl = (id: string) => `https://bunpo.test/tests/${id}`;

/** The quiz page's submit: the answers as JSON, the way `useSubmit` sends them. */
function submit(id: string, body: string) {
  const request = new Request(quizUrl(id), { method: "POST", headers: { "Content-Type": "application/json" }, body });
  return action(routeArgs<Parameters<typeof action>[0]>(request, { id }));
}

beforeEach(resetDatabase);

describe("quiz loader", () => {
  it("gives the quiz of the test, without its answers", async () => {
    const { id } = await createTest(buildPayload());

    const { quiz } = await loader(routeArgs<Parameters<typeof loader>[0]>(new Request(quizUrl(id)), { id }));

    expect(quiz).toMatchObject({ id, title: "第1週 1日目", questionCount: 3 });
    expect(JSON.stringify(quiz)).not.toContain("answerIndex");
  });

  it("opens the results of a test that is taken, since only a retake clears them", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission());
    const args = routeArgs<Parameters<typeof loader>[0]>(new Request(quizUrl(id)), { id });

    expect(((await thrownBy(() => loader(args))) as Response).headers.get("Location")).toBe(`/tests/${id}/results`);
  });

  it("throws a 404 for a test that does not exist", async () => {
    const args = routeArgs<Parameters<typeof loader>[0]>(new Request(quizUrl(UNKNOWN_ID)), { id: UNKNOWN_ID });

    expect(await thrownBy(() => loader(args))).toMatchObject({ data: "Test not found", init: { status: 404 } });
  });
});

describe("quiz action", () => {
  it("grades and saves the answers, then opens the results", async () => {
    const { id } = await createTest(buildPayload());

    const response = await submit(id, JSON.stringify({ answers: { q1: 2, q3: 1 } }));

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).headers.get("Location")).toBe(`/tests/${id}/results`);
    expect((await getTest(id))?.submission).toMatchObject({ answers: { q1: 2, q3: 1 }, score: 1, total: 3 });
  });

  it("takes the learned mark off each word a kanji test got wrong, and keeps the right ones", async () => {
    const { id } = await createTest(buildKanjiTestPayload());
    await markLearned(WORD_ID);

    await submit(id, JSON.stringify({ answers: { q1: 0, q2: 0 } }));

    expect(await learnedIds()).toEqual(new Set());

    const right = await createTest(buildKanjiTestPayload());
    await markLearned(WORD_ID);
    await submit(right.id, JSON.stringify({ answers: { q1: 2, q2: 0 } }));

    expect(await learnedIds()).toEqual(new Set([WORD_ID]));
  });

  it("keeps the first result when the test is submitted again, and opens it", async () => {
    const { id } = await createTest(buildPayload());
    await submit(id, JSON.stringify({ answers: { q1: 2 } }));

    const response = await submit(id, JSON.stringify({ answers: { q1: 0, q3: 1 } }));

    expect((response as Response).headers.get("Location")).toBe(`/tests/${id}/results`);
    expect(await getTest(id)).toMatchObject({ submission: { answers: { q1: 2 } }, attempts: [{ score: 1 }] });
  });

  describe("reading the answers", () => {
    it("answers 400 with an error to show for a body that is not answers, and saves nothing", async () => {
      const { id } = await createTest(buildPayload());

      for (const body of ["not json", JSON.stringify({ answers: { q1: 9 } })]) {
        expect(await submit(id, body)).toMatchObject({
          data: { error: "Your answers couldn't be read. Please try again." },
          init: { status: 400 },
        });
      }
      expect((await getTest(id))?.submission).toBeNull();
    });
  });

  describe("finding the test", () => {
    it("throws a 404 for a test that does not exist", async () => {
      expect(await thrownBy(() => submit(UNKNOWN_ID, JSON.stringify({ answers: {} })))).toMatchObject({
        init: { status: 404 },
      });
    });
  });
});

describe("quiz meta", () => {
  it("names the page after the test, or the app alone when the test is missing", () => {
    const metaOf = (loaderData: unknown) => meta({ loaderData } as Parameters<typeof meta>[0]);

    expect(metaOf({ quiz: { title: "第1週 1日目" } })).toEqual([{ title: "第1週 1日目 · 文法ドリル" }]);
    expect(metaOf(undefined)).toEqual([{ title: "文法ドリル" }]);
  });
});
