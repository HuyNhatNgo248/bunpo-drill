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
    });
  });

  it("sends a signed-in user to their tests", async () => {
    const request = await signedInRequest(7, URL);

    const thrown = (await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(request)))) as Response;

    expect(thrown.headers.get("Location")).toBe("/");
  });
});
