import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { createTest, saveSubmission } from "~/lib/tests.server";
import { loader, meta } from "../results";

const UNKNOWN_ID = "20261027-000000";

/** Runs the loader for /tests/`id`/results. */
const load = (id: string) =>
  loader(routeArgs<Parameters<typeof loader>[0]>(new Request(`https://bunpo.test/tests/${id}/results`), { id }));

beforeEach(resetDatabase);

describe("results loader", () => {
  it("grades the saved answers of a taken test", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission({ answers: { q1: 2, q2: [1, 0, 2, 3] } }));

    expect((await load(id)).results).toMatchObject({ id, score: 2, total: 3, percent: 67 });
  });

  describe("finding the result", () => {
    it("throws a 404 for a test that does not exist", async () => {
      expect(await thrownBy(() => load(UNKNOWN_ID))).toMatchObject({ init: { status: 404 } });
    });

    it("opens the quiz instead for a test that is not taken yet", async () => {
      const { id } = await createTest(buildPayload());

      const thrown = (await thrownBy(() => load(id))) as Response;

      expect(thrown.status).toBe(302);
      expect(thrown.headers.get("Location")).toBe(`/tests/${id}`);
    });
  });
});

describe("results meta", () => {
  it("names the page after the test, or the app alone when there is no result", () => {
    const metaOf = (loaderData: unknown) => meta(metaArgs<Parameters<typeof meta>[0]>({ loaderData }));

    expect(metaOf({ results: { title: "第1週 1日目" } })).toEqual([{ title: "Results · 第1週 1日目 · 文法ドリル" }]);
    expect(metaOf(undefined)).toEqual([{ title: "文法ドリル" }]);
  });
});
