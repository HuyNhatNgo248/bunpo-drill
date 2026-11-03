import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload, GRAMMAR_ID } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { routeArgs } from "#tests/helpers/route";
import { createTest, getTest } from "~/lib/tests.server";
import { action } from "../api.tests.$id";

/** The signed-in user, whose progress the routes read and write. */
const USER_ID = 1;

/** A well-formed id that no saved test has. */
const UNKNOWN_ID = "20261027-000000";

/** Sends `body` as JSON to /api/tests/`id` with `method`. */
async function send(id: string, method: string, body?: unknown) {
  const init: RequestInit = { method, body: body === undefined ? undefined : JSON.stringify(body) };
  return action(routeArgs<Parameters<typeof action>[0]>(await signedInRequest(USER_ID, `https://bunpo.test/api/tests/${id}`, init), { id }));
}

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("PATCH /api/tests/:id", () => {
  it("marks a review chip and answers with the marks of the test", async () => {
    const { id } = await createTest(buildPayload());

    const response = await send(id, "PATCH", { grammarId: GRAMMAR_ID, reviewed: true });

    expect(await response.json()).toEqual({ reviewed: { [GRAMMAR_ID]: true } });
  });

  it("clears a mark", async () => {
    const { id } = await createTest(buildPayload());
    await send(id, "PATCH", { grammarId: GRAMMAR_ID, reviewed: true });

    expect(await (await send(id, "PATCH", { grammarId: GRAMMAR_ID, reviewed: false })).json()).toEqual({ reviewed: {} });
  });

  describe("reading the body", () => {
    it("answers 400 for a body that is not a grammar id and a flag", async () => {
      const { id } = await createTest(buildPayload());

      const response = await send(id, "PATCH", { grammarId: GRAMMAR_ID, reviewed: "yes" });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Body must be {"grammarId": string, "reviewed": boolean}.' });
    });
  });

  describe("finding the test", () => {
    it("answers 404 for a test that does not exist", async () => {
      const response = await send(UNKNOWN_ID, "PATCH", { grammarId: GRAMMAR_ID, reviewed: true });

      expect(response.status).toBe(404);
    });
  });
});

describe("DELETE /api/tests/:id", () => {
  it("lets the admin delete a test", async () => {
    const { id } = await createTest(buildPayload());

    const response = await send(id, "DELETE");

    expect(await response.json()).toEqual({ deleted: id });
    expect(await getTest(id, USER_ID)).toBeNull();
  });

  it("refuses a user who is not the admin and keeps the test", async () => {
    const { id } = await createTest(buildPayload());
    const request = await signedInRequest(2, `https://bunpo.test/api/tests/${id}`, { method: "DELETE" });

    const response = await action(routeArgs<Parameters<typeof action>[0]>(request, { id })).catch((thrown: Response) => thrown);

    expect(response.status).toBe(403);
    expect(await getTest(id, USER_ID)).not.toBeNull();
  });

  it("answers 404 for a test that does not exist", async () => {
    expect((await send(UNKNOWN_ID, "DELETE")).status).toBe(404);
  });
});

describe("another method", () => {
  it("answers 405 and names the methods it allows", async () => {
    const response = await send(UNKNOWN_ID, "PUT");

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("PATCH, DELETE");
  });
});
