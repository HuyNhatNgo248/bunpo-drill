import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload, GRAMMAR_ID } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { createTest, getTest } from "~/lib/tests.server";
import { action } from "../api.tests.$id";

/** A well-formed id that no saved test has. */
const UNKNOWN_ID = "20261027-000000";

/** Sends `body` as JSON to /api/tests/`id` with `method`. */
function send(id: string, method: string, body?: unknown) {
  const init: RequestInit = { method, body: body === undefined ? undefined : JSON.stringify(body) };
  return action(routeArgs<Parameters<typeof action>[0]>(new Request(`https://bunpo.test/api/tests/${id}`, init), { id }));
}

beforeEach(resetDatabase);

describe("DELETE /api/tests/:id", () => {
  it("deletes the test and answers with its id", async () => {
    const { id } = await createTest(buildPayload());

    expect(await (await send(id, "DELETE")).json()).toEqual({ deleted: id });
    expect(await getTest(id)).toBeNull();
  });

  it("answers 404 for a test that does not exist", async () => {
    const response = await send(UNKNOWN_ID, "DELETE");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Test not found." });
  });
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

describe("another method", () => {
  it("answers 405 and names the methods it allows", async () => {
    const response = await send(UNKNOWN_ID, "POST", {});

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("PATCH, DELETE");
  });
});
