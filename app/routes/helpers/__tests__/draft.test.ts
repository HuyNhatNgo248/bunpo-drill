import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { routeArgs } from "#tests/helpers/route";
import { createTest, getTest } from "~/lib/tests.server";
import { action } from "../draft";

/** The signed-in user, whose progress the routes read and write. */
const USER_ID = 1;

const UNKNOWN_ID = "20261027-000000";

/** The quiz's save of its draft: the answers and checked parts as JSON, the way its autosave sends them. */
async function save(id: string, body: unknown) {
  const request = await signedInRequest(USER_ID, `https://bunpo.test/tests/${id}/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return action(routeArgs<Parameters<typeof action>[0]>(request, { id }));
}

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("POST /tests/:id/draft", () => {
  it("saves the answers and checked parts, and answers 204", async () => {
    const { id } = await createTest(buildPayload());

    const response = await save(id, { answers: { q1: 2, q2: [1, null, null, null] }, checked: [1] });

    expect(response.status).toBe(204);
    expect((await getTest(id, USER_ID))?.draft).toEqual({ answers: { q1: 2, q2: [1, null, null, null] }, checked: [1] });
  });

  it("answers 204 and saves nothing for a test that does not exist", async () => {
    expect((await save(UNKNOWN_ID, { answers: { q1: 2 }, checked: [] })).status).toBe(204);
  });

  describe("reading the body", () => {
    it("answers 400 for a body that is not a draft, and saves nothing", async () => {
      const { id } = await createTest(buildPayload());

      for (const body of ["{", { answers: { q1: 9 }, checked: [] }, { answers: {}, checked: [4] }, { answers: {} }]) {
        const response = await save(id, body);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Body must be {"answers": {…}, "checked": number[]}.' });
      }
      expect((await getTest(id, USER_ID))?.draft).toBeNull();
    });
  });
});
