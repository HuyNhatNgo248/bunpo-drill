import { describe, expect, it } from "vitest";
import { routeArgs } from "#tests/helpers/route";
import { action, loader } from "../locale";

const URL = "https://bunpo.test/locale";

/** POST /locale with these form fields. */
const post = (fields: Record<string, string>) =>
  action(routeArgs<Parameters<typeof action>[0]>(new Request(URL, { method: "POST", body: new URLSearchParams(fields) })));

describe("POST /locale", () => {
  it("keeps the language in its cookie, and shows the same page again", async () => {
    const response = await post({ locale: "ja", redirectTo: "/tests/20261027-abc123?x=1" });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/tests/20261027-abc123?x=1");
    expect(response.headers.get("Set-Cookie")).toBe("lang=ja; Path=/; Max-Age=31536000; SameSite=Lax");
  });

  it("refuses a language the app does not have", async () => {
    const response = await post({ locale: "fr", redirectTo: "/" });

    expect(response.status).toBe(400);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("goes home instead of to another site", async () => {
    for (const redirectTo of ["//evil.example", "https://evil.example", "/\\evil.example"]) {
      expect((await post({ locale: "en", redirectTo })).headers.get("Location")).toBe("/");
    }
  });
});

describe("GET /locale", () => {
  it("goes home and changes nothing", () => {
    const response = loader();

    expect(response.headers.get("Location")).toBe("/");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
});
