import { describe, expect, it } from "vitest";
import { routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import type { TestPayload } from "~/lib/payload";
import { getTrialTest } from "~/lib/trials.server";
import { action } from "../try-check";

const ID = "n2-1";

// n3-1 is a grammar test.
const PAYLOAD = getTrialTest(ID)!.payload as TestPayload;

/** The quiz's check of one part with no cookie: the part and the answers as JSON, the way its fetcher sends them. */
function check(id: string, body: unknown) {
  const request = new Request(`https://bunpo.test/try/${id}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return action(routeArgs<Parameters<typeof action>[0]>(request, { id }));
}

describe("POST /try/:id/check", () => {
  it("grades the part asked for, with its right answers", async () => {
    const [first] = PAYLOAD.sections[0].questions;

    const result = await check(ID, { section: 1, answers: { [first.id]: first.answerIndex } });

    expect(result).toMatchObject({ section: { no: 1, type: "fill-blank", correct: 1, total: 15 } });
  });

  it("answers 400 for a body that is not a part and answers", async () => {
    for (const body of ["not json", { section: 4, answers: {} }, { section: 1 }]) {
      expect(await check(ID, body)).toMatchObject({ data: { error: "This part couldn't be checked. Please try again." }, init: { status: 400 } });
    }
  });

  it("throws a 404 for a test that is not a trial test", async () => {
    expect(await thrownBy(() => check("20261027-abc123", { section: 1, answers: {} }))).toMatchObject({ data: "Test not found", init: { status: 404 } });
  });
});
