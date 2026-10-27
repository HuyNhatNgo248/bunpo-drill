import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAIL_FROM } from "#tests/helpers/env";
import { sendMail, type Mail } from "./mail.server";

const MAIL: Mail = { to: "huy@example.com", subject: "文法ドリル：パスワードの再設定", text: "リンク：https://bunpo.test/reset-password?token=abc" };

/** Replaces fetch with one that answers `status`, and returns it so a test can read what was sent. */
function stubFetch(status = 200) {
  const fetch = vi.fn(async () => new Response(status === 200 ? '{"id":"1"}' : "domain is not verified", { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

let info: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  info = vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendMail", () => {
  it("sends the email through Resend, from MAIL_FROM", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetch = stubFetch();

    await sendMail(MAIL);

    expect(fetch).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer re_test", "Content-Type": "application/json" },
      body: JSON.stringify({ from: MAIL_FROM, to: [MAIL.to], subject: MAIL.subject, text: MAIL.text }),
    });
  });

  it("prints the email to the log in development without an API key, and sends nothing", async () => {
    const fetch = stubFetch();

    await sendMail(MAIL);

    expect(fetch).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining(`To: ${MAIL.to}`));
    expect(info).toHaveBeenCalledWith(expect.stringContaining(MAIL.text));
  });

  describe("failing", () => {
    it("throws in production without an API key, instead of dropping the email", async () => {
      vi.stubEnv("NODE_ENV", "production");
      stubFetch();

      await expect(sendMail(MAIL)).rejects.toThrow("RESEND_API_KEY is not set.");
    });

    it("throws with Resend's answer when Resend refuses the email", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");
      stubFetch(403);

      await expect(sendMail(MAIL)).rejects.toThrow("Resend refused the email (403): domain is not verified");
    });
  });
});
