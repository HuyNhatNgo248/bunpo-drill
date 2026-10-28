import { describe, expect, it } from "vitest";
import { routeArgs } from "#tests/helpers/route";
import { loader } from "../login";

/** Where an old /login link with `search` now goes. */
const locationOf = (search: string) =>
  (loader(routeArgs<Parameters<typeof loader>[0]>(new Request(`https://bunpo.test/login${search}`))) as Response).headers.get("Location");

describe("GET /login", () => {
  it("sends an old sign-in link to /signin, with the page to return to", () => {
    expect(locationOf("")).toBe("/signin");
    expect(locationOf("?redirectTo=%2Faccount")).toBe("/signin?redirectTo=%2Faccount");
  });

  it("sends an old sign-up link to /signup, without the mode", () => {
    expect(locationOf("?mode=signup")).toBe("/signup");
    expect(locationOf("?mode=signup&redirectTo=%2Faccount")).toBe("/signup?redirectTo=%2Faccount");
  });
});
