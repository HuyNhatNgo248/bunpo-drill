import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { ForgotPassword } from ".";

/** The page, with the action that its form posts to. */
function renderPage(result?: { sent?: string; error?: string }) {
  const { action, requests } = recordingAction();
  renderRoute(<ForgotPassword result={result} />, { url: "/forgot-password", action });
  return requests;
}

describe("ForgotPassword", () => {
  it("sends the email that the link should go to", async () => {
    const requests = renderPage();

    await userEvent.type(await screen.findByRole("textbox", { name: "メールアドレス" }), "huy@example.com");
    await userEvent.click(screen.getByRole("button", { name: "リンクを送る" }));

    await waitFor(() => expect(requests).toEqual([{ method: "POST", path: "/forgot-password", body: { email: "huy@example.com" } }]));
  });

  it("says that a link went out, without saying whether an account has the email", async () => {
    renderPage({ sent: "huy@example.com" });

    expect(await screen.findByRole("status")).toHaveTextContent("huy@example.com のアカウントがあれば、リンクを送りました。");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows the error of a value that is not an email, and marks the field", async () => {
    renderPage({ error: "メールアドレスの形式が正しくありません。" });

    expect(await screen.findByRole("alert")).toHaveTextContent("メールアドレスの形式が正しくありません。");
    expect(screen.getByRole("textbox", { name: "メールアドレス" })).toHaveAttribute("aria-invalid", "true");
  });

  it("links back to the login page", async () => {
    renderPage();

    expect(await screen.findByRole("link", { name: "ログインに戻る" })).toHaveAttribute("href", "/login");
  });
});
