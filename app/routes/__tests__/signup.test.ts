import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { cookieOf, signedInRequest } from "#tests/helpers/session";
import { thrownBy } from "#tests/helpers/thrown";
import { currentUserId } from "~/lib/auth.server";
import { createUser, findUserByEmail, verifyUser } from "~/lib/users.server";
import { action, loader } from "../signup";

const URL = "https://bunpo.test/signup";

const PASSWORD = "correct horse battery";

/** Posts a valid new account to the sign-up action, with `fields` changed, the way the form sends it. */
function signUp(fields: Record<string, string>) {
  const body = new URLSearchParams({ name: "Mai", email: "mai@example.com", password: PASSWORD, ...fields });
  return action(routeArgs<Parameters<typeof action>[0]>(new Request(URL, { method: "POST", body })));
}

beforeEach(resetDatabase);

describe("signup loader", () => {
  it("shows the page to a visitor who is not signed in", async () => {
    expect(await loader(routeArgs<Parameters<typeof loader>[0]>(new Request(URL)))).toBeNull();
  });

  it("sends a signed-in user on to the page they came for", async () => {
    const request = await signedInRequest(7, `${URL}?redirectTo=%2Faccount`);

    const thrown = (await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(request)))) as Response;

    expect(thrown.headers.get("Location")).toBe("/account");
  });
});

describe("signup action", () => {
  it("makes the account, signs it in, and goes on to the page", async () => {
    const response = (await signUp({ redirectTo: "/account" })) as Response;

    expect(response.headers.get("Location")).toBe("/account");
    const id = await verifyUser("Mai", PASSWORD);
    expect(await currentUserId(new Request(URL, { headers: { Cookie: cookieOf(response) } }))).toBe(id);
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
