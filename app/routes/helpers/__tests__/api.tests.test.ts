import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { createTest, listTests } from "~/lib/tests.server";
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
