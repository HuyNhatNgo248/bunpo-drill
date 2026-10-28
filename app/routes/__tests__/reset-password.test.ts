import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "#tests/helpers/db";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { cookieOf } from "#tests/helpers/session";
import { currentUserId } from "~/lib/auth.server";
import { createPasswordReset, isPasswordResetValid } from "~/lib/password-reset.server";
import { createUser, verifyUser } from "~/lib/users.server";
import { action, loader, meta } from "../reset-password";

const URL = "https://bunpo.test/reset-password";

const PASSWORD = "correct horse battery";

/** Opens the link with `token`. */
const open = (token: string) => loader(routeArgs<Parameters<typeof loader>[0]>(new Request(`${URL}?token=${token}`)));

/** Posts the form with `token` and a new `password`. */
function post(token: string, password: string) {
  const request = new Request(URL, { method: "POST", body: new URLSearchParams({ token, password }) });
  return action(routeArgs<Parameters<typeof action>[0]>(request));
}

let userId: number;
let token: string;

beforeEach(async () => {
  await resetDatabase();
  userId = (await createUser("Huy", PASSWORD, "huy@example.com"))!;
  token = (await createPasswordReset(userId))!;
});

describe("reset-password loader", () => {
  it("passes on the token of a link that still works", async () => {
    expect(await open(token)).toEqual({ token, valid: true });
  });

  it("marks a link that does not work, and a visit with no token", async () => {
    expect(await open("made-up-token")).toEqual({ token: "made-up-token", valid: false });
    expect(await loader(routeArgs<Parameters<typeof loader>[0]>(new Request(URL)))).toEqual({ token: "", valid: false });
  });
});

describe("reset-password action", () => {
  it("sets the new password, uses the link up, and signs the user in", async () => {
    const response = (await post(token, "a new passphrase")) as Response;

    expect(response.headers.get("Location")).toBe("/");
    expect(await currentUserId(new Request(URL, { headers: { Cookie: cookieOf(response) } }))).toBe(userId);
    expect(await verifyUser("Huy", "a new passphrase")).toBe(userId);
    expect(await isPasswordResetValid(token)).toBe(false);
  });

  it("answers 400 for a password that is too short, and keeps the link", async () => {
    expect(await post(token, "short")).toMatchObject({
      data: { error: "Use a password of at least 8 characters." },
      init: { status: 400 },
    });
    expect(await isPasswordResetValid(token)).toBe(true);
  });

  it("answers 410 for a link that does not work, and keeps the password", async () => {
    expect(await post("made-up-token", "a new passphrase")).toMatchObject({
      data: { error: "This link has expired or was already used. Send the email again." },
      init: { status: 410 },
    });
    expect(await verifyUser("Huy", PASSWORD)).toBe(userId);
  });
});

describe("reset-password meta", () => {
  it("names the page", () => {
    expect(meta(metaArgs<Parameters<typeof meta>[0]>())).toEqual([{ title: "New password · 文法ドリル" }]);
  });
});
