import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { createTest, getTest, saveSubmission } from "~/lib/tests.server";
import { action } from "../check";

const UNKNOWN_ID = "20261027-000000";

/** The quiz's check of one part: the part and the answers as JSON, the way its fetcher sends them. */
function check(id: string, body: unknown) {
  const request = new Request(`https://bunpo.test/tests/${id}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return action(routeArgs<Parameters<typeof action>[0]>(request, { id }));
}

beforeEach(resetDatabase);

describe("POST /tests/:id/check", () => {
  it("grades the part asked for, with its right answers, and saves nothing", async () => {
    const { id } = await createTest(buildPayload());

    const result = await check(id, { section: 1, answers: { q1: 2 } });

    expect(result).toMatchObject({
      section: { no: 1, type: "fill-blank", correct: 1, total: 1, groups: [{ questions: [{ id: "q1", correct: true }] }] },
    });
    expect(await getTest(id)).toMatchObject({ submission: null, attempts: [] });
  });

  it("counts an unanswered question of the part as wrong", async () => {
    const { id } = await createTest(buildPayload());

    expect(await check(id, { section: 2, answers: {} })).toMatchObject({ section: { no: 2, correct: 0, total: 1 } });
  });

  it("answers 400 for a body that is not a part and answers", async () => {
    const { id } = await createTest(buildPayload());

    for (const body of ["not json", { section: 4, answers: {} }, { section: 1 }]) {
      const result = await check(id, body);
      expect(result).toMatchObject({ data: { error: "This part couldn't be checked. Please try again." }, init: { status: 400 } });
    }
  });

  it("sends a test that is taken already to its results", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission());

    const response = (await check(id, { section: 1, answers: {} })) as Response;

    expect(response.headers.get("Location")).toBe(`/tests/${id}/results`);
  });

  it("throws a 404 for a test that does not exist", async () => {
    expect(await thrownBy(() => check(UNKNOWN_ID, { section: 1, answers: {} }))).toMatchObject({
      data: "Test not found",
      init: { status: 404 },
    });
  });
});
