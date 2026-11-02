import { beforeEach, describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { ensureUser, signedInRequest } from "#tests/helpers/session";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { addNote } from "~/lib/notes.server";
import { createTest, saveSubmission } from "~/lib/tests.server";
import { loader, meta } from "../results";

/** The signed-in user, whose progress the routes read and write. */
const USER_ID = 1;

const UNKNOWN_ID = "20261027-000000";

/** Runs the loader for /tests/`id`/results. */
const load = async (id: string) =>
  loader(routeArgs<Parameters<typeof loader>[0]>(await signedInRequest(USER_ID, `https://bunpo.test/tests/${id}/results`), { id }));

beforeEach(async () => {
  await resetDatabase();
  await ensureUser(USER_ID);
});

describe("results loader", () => {
  it("grades the saved answers of a taken test", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(USER_ID, id, buildSubmission({ answers: { q1: 2, q2: [1, 0, 2, 3] } }));

    expect((await load(id)).results).toMatchObject({ id, score: 2, total: 3, percent: 67 });
  });

  it("gives the user's notes, to highlight their words", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(USER_ID, id, buildSubmission());
    await addNote(USER_ID, { text: "かいがあって", sentence: "", testId: id, memo: "" });

    expect((await load(id)).notes).toMatchObject([{ text: "かいがあって" }]);
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
