import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_URL } from "#tests/helpers/env";
import { resetDatabase } from "#tests/helpers/db";
import { metaArgs, routeArgs } from "#tests/helpers/route";
import { createUser } from "~/lib/users.server";
import { action, meta } from "../forgot-password";

const URL = "https://bunpo.test/forgot-password";

/** Posts the form with `email`. */
function ask(email: string) {
  const request = new Request(URL, { method: "POST", body: new URLSearchParams({ email }) });
  return action(routeArgs<Parameters<typeof action>[0]>(request));
}

/** The emails that went out. Without RESEND_API_KEY, the app prints each one to the log. */
let mails: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  await resetDatabase();
  mails = vi.spyOn(console, "info").mockImplementation(() => {});
  await createUser("Huy", "correct horse battery", "huy@example.com");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("forgot-password action", () => {
  it("emails a reset link to the account with the email", async () => {
    expect(await ask("huy@example.com")).toEqual({ sent: "huy@example.com" });

    await vi.waitFor(() => expect(mails).toHaveBeenCalledOnce());
    expect(String(mails.mock.calls[0][0])).toMatch(new RegExp(`To: huy@example.com[\\s\\S]*${APP_URL}/reset-password\\?token=[\\w-]{43}`));
  });

  it("finds the account whatever the case and the spaces of the email", async () => {
    expect(await ask("  Huy@Example.com ")).toEqual({ sent: "huy@example.com" });

    await vi.waitFor(() => expect(mails).toHaveBeenCalledOnce());
  });

  it("answers the same for an email that no account has, and sends nothing", async () => {
    expect(await ask("nobody@example.com")).toEqual({ sent: "nobody@example.com" });

    // The email to an account goes out after the answer, so wait a moment before saying none went out.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mails).not.toHaveBeenCalled();
  });

  it("sends no second email within a minute, but gives the same answer", async () => {
    await ask("huy@example.com");
    await vi.waitFor(() => expect(mails).toHaveBeenCalledOnce());

    expect(await ask("huy@example.com")).toEqual({ sent: "huy@example.com" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mails).toHaveBeenCalledOnce();
  });

  it("answers 400 for a value that is not an email", async () => {
    expect(await ask("huy")).toMatchObject({ data: { error: "That email address doesn't look right." }, init: { status: 400 } });
  });
});

describe("forgot-password meta", () => {
  it("names the page", () => {
    expect(meta(metaArgs<Parameters<typeof meta>[0]>())).toEqual([{ title: "Reset your password · 文法ドリル" }]);
  });
});
