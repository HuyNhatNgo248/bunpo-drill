import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { signedInRequest } from "#tests/helpers/session";
import { thrownBy } from "#tests/helpers/thrown";
import { loader } from "../welcome";

const URL = "https://bunpo.test/welcome";

beforeEach(resetDatabase);

describe("welcome loader", () => {
  it("shows the page to a visitor who is not signed in, with the next exam", async () => {
    expect(await loader(routeArgs<Parameters<typeof loader>[0]>(new Request(URL)))).toEqual({
      exam: { date: expect.stringMatching(/^\d{4}-(07|12)-0[1-7]$/), daysLeft: expect.any(Number) },
      trials: expect.arrayContaining([
        expect.objectContaining({ id: "n3-1", title: "総合テスト 1", level: "N3", questionCount: 45, patternCount: 38, weeks: [2, 3, 4, 5, 6] }),
      ]),
    });
  });

  it("sends a signed-in user to their tests", async () => {
    const request = await signedInRequest(7, URL);

    const thrown = (await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(request)))) as Response;

    expect(thrown.headers.get("Location")).toBe("/");
  });
});
