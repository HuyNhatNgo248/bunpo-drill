import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload, GRAMMAR_ID } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { createTest, getTest, saveSubmission, setReviewed } from "~/lib/tests.server";
import { action, loader } from "../retake";

/** The signed-in user, whose progress the routes read and write. */
const USER_ID = 1;

const UNKNOWN_ID = "20261027-000000";

const retakeUrl = (id: string) => `https://bunpo.test/tests/${id}/retake`;

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("POST /tests/:id/retake", () => {
  it("clears the last result and the review marks, then opens the quiz", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(USER_ID, id, buildSubmission());
    await setReviewed(USER_ID, id, GRAMMAR_ID, true);

    const response = await action(
      routeArgs<Parameters<typeof action>[0]>(await signedInRequest(USER_ID, retakeUrl(id), { method: "POST" }), { id }),
    );

    expect(response.headers.get("Location")).toBe(`/tests/${id}`);
    expect(await getTest(id, USER_ID)).toMatchObject({ submission: null, reviewed: {} });
  });

  it("with ?only=wrong, keeps the right answers and asks only the wrong ones", async () => {
    const { id } = await createTest(buildPayload());
    // q1 right, q2 wrong, q3 right.
    await saveSubmission(USER_ID, id, buildSubmission({ answers: { q1: 2, q2: [2, 1, 0, 3], q3: 0 } }));

    const request = await signedInRequest(USER_ID, `${retakeUrl(id)}?only=wrong`, { method: "POST" });
    const response = await action(routeArgs<Parameters<typeof action>[0]>(request, { id }));

    expect(response.headers.get("Location")).toBe(`/tests/${id}`);
    expect(await getTest(id, USER_ID)).toMatchObject({
      submission: null,
      draft: { answers: { q1: 2, q3: 0 }, checked: [], kept: ["q1", "q3"] },
    });
  });

  it("throws a 404 for a test that does not exist", async () => {
    const args = routeArgs<Parameters<typeof action>[0]>(await signedInRequest(USER_ID, retakeUrl(UNKNOWN_ID), { method: "POST" }), { id: UNKNOWN_ID });

    expect(await thrownBy(() => action(args))).toMatchObject({ data: "Test not found", init: { status: 404 } });
  });
});

describe("GET /tests/:id/retake", () => {
  it("opens the quiz and keeps the last result", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(USER_ID, id, buildSubmission());

    const response = loader(routeArgs<Parameters<typeof loader>[0]>(await signedInRequest(USER_ID, retakeUrl(id)), { id }));

    expect(response.headers.get("Location")).toBe(`/tests/${id}`);
    expect((await getTest(id, USER_ID))?.submission).not.toBeNull();
  });
});
