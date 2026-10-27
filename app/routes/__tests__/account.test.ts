import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { routeArgs } from "#tests/helpers/route";
import { signedInRequest } from "#tests/helpers/session";
import { thrownBy } from "#tests/helpers/thrown";
import { createUser, getUser, verifyUser } from "~/lib/users.server";
import { action, loader } from "../account";

const URL = "https://bunpo.test/account";

const PASSWORD = "correct horse battery";

/** Posts `fields` to the account action as the signed-in `userId`, the way the forms send them. */
async function post(userId: number, fields: Record<string, string>) {
  const request = await signedInRequest(userId, URL, { method: "POST", body: new URLSearchParams(fields) });
  return action(routeArgs<Parameters<typeof action>[0]>(request));
}

let userId: number;

beforeEach(async () => {
  await resetDatabase();
  userId = (await createUser("Huy", PASSWORD))!;
});

describe("account loader", () => {
  it("gives the signed-in user", async () => {
    const request = await signedInRequest(userId, URL);

    expect(await loader(routeArgs<Parameters<typeof loader>[0]>(request))).toEqual({ user: { id: userId, name: "Huy" } });
  });

  it("throws a 401 for a request with no login cookie", async () => {
    const thrown = (await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(new Request(URL))))) as Response;

    expect(thrown.status).toBe(401);
  });

  it("throws a 404 for a cookie of a user that no longer exists", async () => {
    const request = await signedInRequest(999, URL);

    expect(await thrownBy(() => loader(routeArgs<Parameters<typeof loader>[0]>(request)))).toMatchObject({
      init: { status: 404 },
    });
  });
});

describe("account action", () => {
  describe("the name form", () => {
    it("renames the user", async () => {
      expect(await post(userId, { intent: "name", name: "  Huy N.  " })).toMatchObject({
        data: { form: "name", saved: "名前を変更しました。" },
      });
      expect(await getUser(userId)).toEqual({ id: userId, name: "Huy N." });
    });

    it("answers 400 for a name of the wrong length", async () => {
      expect(await post(userId, { intent: "name", name: "a".repeat(31) })).toMatchObject({
        data: { form: "name", error: "名前は1〜30文字で入力してください。" },
        init: { status: 400 },
      });
    });

    it("answers 409 for a name that another user has", async () => {
      await createUser("Mai", PASSWORD);

      expect(await post(userId, { intent: "name", name: "Mai" })).toMatchObject({
        data: { form: "name", error: "この名前はもう使われています。" },
        init: { status: 409 },
      });
    });
  });

  describe("the password form", () => {
    it("changes the password when the current one matches", async () => {
      expect(await post(userId, { intent: "password", current: PASSWORD, next: "a new passphrase" })).toMatchObject({
        data: { form: "password", saved: "パスワードを変更しました。" },
      });
      expect(await verifyUser("Huy", "a new passphrase")).toBe(userId);
    });

    it("answers 400 for a new password that is too short", async () => {
      expect(await post(userId, { intent: "password", current: PASSWORD, next: "short" })).toMatchObject({
        data: { form: "password", error: "パスワードは8文字以上にしてください。" },
        init: { status: 400 },
      });
    });

    it("answers 401 for a wrong current password, and keeps the old one", async () => {
      expect(await post(userId, { intent: "password", current: "wrong", next: "a new passphrase" })).toMatchObject({
        data: { form: "password", error: "現在のパスワードが違います。" },
        init: { status: 401 },
      });
      expect(await verifyUser("Huy", PASSWORD)).toBe(userId);
    });
  });

  it("throws a 401 for a post with no login cookie", async () => {
    const request = new Request(URL, { method: "POST", body: new URLSearchParams({ intent: "name", name: "Mai" }) });

    expect(((await thrownBy(() => action(routeArgs<Parameters<typeof action>[0]>(request)))) as Response).status).toBe(401);
  });
});
