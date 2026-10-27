import { describe, expect, it } from "vitest";
import { routeArgs } from "#tests/helpers/route";
import { currentUserId, signIn } from "~/lib/auth.server";
import { action, loader } from "./logout";

const URL = "https://bunpo.test/logout";

/** The name=value part of a Set-Cookie header, the way a browser sends it back. */
const cookieOf = (response: Response) => (response.headers.get("Set-Cookie") ?? "").split(";")[0];

describe("POST /logout", () => {
  it("clears the login cookie and goes to the login page", async () => {
    const signedIn = cookieOf(await signIn(new Request(URL), 7, "/"));

    const response = await action(routeArgs<Parameters<typeof action>[0]>(new Request(URL, { method: "POST", headers: { Cookie: signedIn } })));

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
