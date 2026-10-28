import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { cookieOf, signedInRequest } from "#tests/helpers/session";
import { thrownBy } from "#tests/helpers/thrown";
import { currentUserId } from "~/lib/auth.server";
import { createUser } from "~/lib/users.server";
import { action, loader } from "../signin";

const URL = "https://bunpo.test/signin";

const PASSWORD = "correct horse battery";

/** Posts `fields` to the sign-in action, the way the form sends them. */
function post(fields: Record<string, string>) {
  const request = new Request(URL, { method: "POST", body: new URLSearchParams(fields) });
  return action(routeArgs<Parameters<typeof action>[0]>(request));
}

/** The delays the action waits for. The wait is skipped, so a wrong guess does not slow the tests down. */
let waits: number[];

beforeEach(async () => {
  await resetDatabase();
  waits = [];
  vi.spyOn(globalThis, "setTimeout").mockImplementation(((run: () => void, ms: number) => {
    waits.push(ms);
    run();
    return 0;
  }) as unknown as typeof setTimeout);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signin loader", () => {
  it("shows the page to a visitor who is not signed in", async () => {
    expect(await loader(routeArgs<Parameters<typeof loader>[0]>(new Request(URL)))).toBeNull();
  });

  it("sends a signed-in user on to the page they came for", async () => {
    const request = await signedInRequest(7, `${URL}?redirectTo=%2Faccount`);

    const thrown = (await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(request)))) as Response;

    expect(thrown.headers.get("Location")).toBe("/account");
  });

  it("sends a signed-in user home instead of to another site", async () => {
    const request = await signedInRequest(7, `${URL}?redirectTo=https%3A%2F%2Fevil.test`);

    const thrown = (await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(request)))) as Response;

    expect(thrown.headers.get("Location")).toBe("/");
  });
});

describe("signin action", () => {
  it("sets the login cookie and goes on to the page", async () => {
    const id = await createUser("Huy", PASSWORD);

    const response = (await post({ name: "Huy", password: PASSWORD, redirectTo: "/tests/x" })) as Response;

    expect(response.headers.get("Location")).toBe("/tests/x");
    expect(await currentUserId(new Request(URL, { headers: { Cookie: cookieOf(response) } }))).toBe(id);
  });

  it("signs in with the email instead of the username, whatever its case", async () => {
    const id = await createUser("Huy", PASSWORD, "huy@example.com");

    const response = (await post({ name: " Huy@Example.com ", password: PASSWORD })) as Response;

    expect(await currentUserId(new Request(URL, { headers: { Cookie: cookieOf(response) } }))).toBe(id);
  });

  it("trims spaces around the name", async () => {
    await createUser("Huy", PASSWORD);

    expect(await post({ name: "  Huy ", password: PASSWORD })).toBeInstanceOf(Response);
  });

  it("answers 401 for a wrong password, after a second's wait that slows guessing", async () => {
    await createUser("Huy", PASSWORD);

    expect(await post({ name: "Huy", password: "wrong" })).toMatchObject({
      data: { error: "ユーザー名（メールアドレス）かパスワードが違います。" },
      init: { status: 401 },
    });
    expect(waits).toEqual([1000]);
  });

  it("goes home instead of to another site, or back to a sign-in page", async () => {
    await createUser("Huy", PASSWORD);

    for (const redirectTo of ["//evil.test", "/signup"]) {
      const response = (await post({ name: "Huy", password: PASSWORD, redirectTo })) as Response;
      expect(response.headers.get("Location")).toBe("/");
    }
  });
});
