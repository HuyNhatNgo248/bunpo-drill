import { describe, expect, it } from "vitest";
import { routeArgs } from "#tests/helpers/route";
import { thrownBy } from "#tests/helpers/thrown";
import { getTrialTest } from "~/lib/trials.server";
import { action, loader } from "../try";

const ID = "n3-1";

const PAYLOAD = getTrialTest(ID)!.payload;

const url = (id: string) => `https://bunpo.test/try/${id}`;

/** The quiz page's submit with no cookie: the answers as JSON, the way `useSubmit` sends them. */
const submit = (id: string, body: string) =>
  action(routeArgs<Parameters<typeof action>[0]>(new Request(url(id), { method: "POST", headers: { "Content-Type": "application/json" }, body }), { id }));

describe("try loader", () => {
  it("gives anyone the quiz of a trial test, without its answers, from the start", async () => {
    const { quiz, draft } = await loader(routeArgs<Parameters<typeof loader>[0]>(new Request(url(ID)), { id: ID }));

    expect(quiz).toMatchObject({ id: ID, title: PAYLOAD.title, level: "N3", questionCount: 45 });
    expect(JSON.stringify(quiz)).not.toContain("answerIndex");
    expect(draft).toEqual({ answers: {}, checks: {} });
  });

  it("throws a 404 for a test that is not a trial test", async () => {
    const thrown = await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(new Request(url("20261027-abc123")), { id: "20261027-abc123" })));

    expect(thrown).toMatchObject({ data: "Test not found", init: { status: 404 } });
  });
});

describe("try action", () => {
  it("grades the answers and gives the results", async () => {
    const [first] = PAYLOAD.sections[0].questions;

    const result = await submit(ID, JSON.stringify({ answers: { [first.id]: first.answerIndex } }));

    expect(result).toMatchObject({ results: { id: ID, score: 1, total: 45, previous: null } });
  });

  it("answers 400 to answers it can't read", async () => {
    expect(await submit(ID, "not json")).toMatchObject({ init: { status: 400 } });
  });

  it("throws a 404 for a test that is not a trial test", async () => {
    expect(await thrownBy(() => submit("n3-9", "{}"))).toMatchObject({ init: { status: 404 } });
  });
});
