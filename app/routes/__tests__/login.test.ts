import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SIGNUP_CODE } from "#tests/helpers/env";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { cookieOf, signedInRequest } from "#tests/helpers/session";
import { thrownBy } from "#tests/helpers/thrown";
import { currentUserId } from "~/lib/auth.server";
import { createUser, findUserByEmail, verifyUser } from "~/lib/users.server";
import { action, loader, meta } from "../login";

const URL = "https://bunpo.test/login";

const PASSWORD = "correct horse battery";

/** Posts `fields` to the login action, the way the login form sends them. */
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

describe("login loader", () => {
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

describe("login action", () => {
  describe("signing in", () => {
    it("sets the login cookie and goes on to the page", async () => {
      const id = await createUser("Huy", PASSWORD);

      const response = (await post({ intent: "login", name: "Huy", password: PASSWORD, redirectTo: "/tests/x" })) as Response;

      expect(response.headers.get("Location")).toBe("/tests/x");
      expect(await currentUserId(new Request(URL, { headers: { Cookie: cookieOf(response) } }))).toBe(id);
    });

    it("trims spaces around the name", async () => {
      await createUser("Huy", PASSWORD);

      expect(await post({ intent: "login", name: "  Huy ", password: PASSWORD })).toBeInstanceOf(Response);
    });

    it("answers 401 for a wrong password, after a second's wait that slows guessing", async () => {
      await createUser("Huy", PASSWORD);

      expect(await post({ intent: "login", name: "Huy", password: "wrong" })).toMatchObject({
        data: { error: "ユーザー名かパスワードが違います。" },
        init: { status: 401 },
      });
      expect(waits).toEqual([1000]);
    });
  });

  describe("signing up", () => {
    const signUp = (fields: Record<string, string>) =>
      post({ intent: "signup", name: "Mai", email: "mai@example.com", password: PASSWORD, code: SIGNUP_CODE, ...fields });

    it("makes the account, signs it in, and goes on to the page", async () => {
      const response = (await signUp({ redirectTo: "/account" })) as Response;

      expect(response.headers.get("Location")).toBe("/account");
      const id = await verifyUser("Mai", PASSWORD);
      expect(await currentUserId(new Request(URL, { headers: { Cookie: cookieOf(response) } }))).toBe(id);
    });

    it("answers 401 for a wrong sign-up code, after the wait, and makes no account", async () => {
      expect(await signUp({ code: "wrong" })).toMatchObject({ data: { error: "招待コードが違います。" }, init: { status: 401 } });
      expect(waits).toEqual([1000]);
      expect(await verifyUser("Mai", PASSWORD)).toBeNull();
    });

    it("answers 400 for a name or a password that breaks the rules", async () => {
      expect(await signUp({ name: "" })).toMatchObject({ init: { status: 400 } });
      expect(await signUp({ password: "short" })).toMatchObject({
        data: { error: "パスワードは8文字以上にしてください。" },
        init: { status: 400 },
      });
    });

    it("saves the email of the new account, in lower case", async () => {
      await signUp({ email: " Mai@Example.com " });

      expect(await findUserByEmail("mai@example.com")).toMatchObject({ name: "Mai" });
    });

    it("answers 400 for an email that is not an email", async () => {
      expect(await signUp({ email: "mai" })).toMatchObject({
        data: { error: "メールアドレスの形式が正しくありません。" },
        init: { status: 400 },
      });
    });

    it("answers 409 for an email that another account has", async () => {
      await createUser("Huy", PASSWORD, "mai@example.com");

      expect(await signUp({})).toMatchObject({ data: { error: "このメールアドレスはもう使われています。" }, init: { status: 409 } });
    });

    it("answers 409 for a name that is taken", async () => {
      await createUser("Mai", PASSWORD);

      expect(await signUp({})).toMatchObject({ data: { error: "このユーザー名はもう使われています。" }, init: { status: 409 } });
    });
  });

  it("goes home instead of to another site after signing in", async () => {
    await createUser("Huy", PASSWORD);

    const response = (await post({ intent: "login", name: "Huy", password: PASSWORD, redirectTo: "//evil.test" })) as Response;

    expect(response.headers.get("Location")).toBe("/");
  });
});

describe("login meta", () => {
  it("names the page after its mode", () => {
    const metaOf = (search: string) => meta({ location: { search } } as Parameters<typeof meta>[0]);

    expect(metaOf("")).toEqual([{ title: "ログイン · 文法ドリル" }]);
    expect(metaOf("?mode=signup")).toEqual([{ title: "アカウント作成 · 文法ドリル" }]);
  });
});
