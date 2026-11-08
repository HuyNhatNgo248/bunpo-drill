import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { signedInRequest } from "#tests/helpers/session";
import { thrownBy } from "#tests/helpers/thrown";
import { loader } from "../info";

const args = (request: Request, subject: string) => routeArgs<Parameters<typeof loader>[0]>(request, { subject });

beforeEach(resetDatabase);

describe("info loader", () => {
  it.each(["grammar", "kanji", "reading"])("gives the %s page to a signed-in user", async (subject) => {
    const request = await signedInRequest(7, `https://bunpo.test/info/${subject}`);

    expect(await loader(args(request, subject))).toEqual({ subject });
  });

  it("is not found for any other subject", async () => {
    const request = await signedInRequest(7, "https://bunpo.test/info/notes");

    expect(await thrownBy(() => loader(args(request, "notes")))).toMatchObject({ init: { status: 404 } });
  });

  it("refuses a visitor who is not signed in", async () => {
    const thrown = (await thrownBy(() => loader(args(new Request("https://bunpo.test/info/grammar"), "grammar")))) as Response;

    expect(thrown.status).toBe(401);
  });
});
