import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload, GRAMMAR_ID } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { createTest, getTest, saveSubmission, setReviewed } from "~/lib/tests.server";
import { action, loader } from "../retake";

const UNKNOWN_ID = "20261027-000000";

const retakeUrl = (id: string) => `https://bunpo.test/tests/${id}/retake`;

beforeEach(resetDatabase);

describe("POST /tests/:id/retake", () => {
  it("clears the last result and the review marks, then opens the quiz", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission());
    await setReviewed(id, GRAMMAR_ID, true);

    const response = await action(
      routeArgs<Parameters<typeof action>[0]>(new Request(retakeUrl(id), { method: "POST" }), { id }),
    );

    expect(response.headers.get("Location")).toBe(`/tests/${id}`);
    expect(await getTest(id)).toMatchObject({ submission: null, reviewed: {} });
  });

  it("throws a 404 for a test that does not exist", async () => {
    const args = routeArgs<Parameters<typeof action>[0]>(new Request(retakeUrl(UNKNOWN_ID), { method: "POST" }), { id: UNKNOWN_ID });

    expect(await thrownBy(() => action(args))).toMatchObject({ data: "Test not found", init: { status: 404 } });
  });
});

describe("GET /tests/:id/retake", () => {
  it("opens the quiz and keeps the last result", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission());

    const response = loader(routeArgs<Parameters<typeof loader>[0]>(new Request(retakeUrl(id)), { id }));

    expect(response.headers.get("Location")).toBe(`/tests/${id}`);
    expect((await getTest(id))?.submission).not.toBeNull();
  });
});
