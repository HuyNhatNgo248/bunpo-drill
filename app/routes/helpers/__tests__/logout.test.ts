import { describe, expect, it } from "vitest";
import { routeArgs } from "#tests/helpers/route";
import { cookieOf, signedInRequest } from "#tests/helpers/session";
import { currentUserId } from "~/lib/auth.server";
import { action, loader } from "../logout";

const URL = "https://bunpo.test/logout";

describe("POST /logout", () => {
  it("clears the login cookie and goes to the login page", async () => {
    const request = await signedInRequest(7, URL, { method: "POST" });

    const response = await action(routeArgs<Parameters<typeof action>[0]>(request));

    expect(response.headers.get("Location")).toBe("/login");
    expect(await currentUserId(new Request(URL, { headers: { Cookie: cookieOf(response) } }))).toBeNull();
  });
});

describe("GET /logout", () => {
  it("goes home and signs nothing out, so a link or a prefetch cannot log the user out", () => {
    const response = loader();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
});
