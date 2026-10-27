import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { ResetPassword } from ".";

const TOKEN = "the-token";

/** The page the emailed link opens, with the action that its form posts to. */
function renderPage(props: { valid?: boolean; error?: string } = {}) {
  const { action, requests } = recordingAction();
  renderRoute(<ResetPassword token={TOKEN} valid={props.valid ?? true} error={props.error} />, { url: "/reset-password", action });
  return requests;
}

describe("ResetPassword", () => {
  it("sends the new password with the token of the link", async () => {
    const requests = renderPage();

    await userEvent.type(await screen.findByLabelText("新しいパスワード"), "a new passphrase");
    await userEvent.click(screen.getByRole("button", { name: "パスワードを変更" }));

    await waitFor(() =>
      expect(requests).toEqual([{ method: "POST", path: "/reset-password", body: { token: TOKEN, password: "a new passphrase" } }]),
    );
  });

  it("shows the error of the last try", async () => {
    renderPage({ error: "パスワードは8文字以上にしてください。" });

    expect(await screen.findByRole("alert")).toHaveTextContent("パスワードは8文字以上にしてください。");
    expect(screen.getByLabelText("新しいパスワード")).toHaveAttribute("aria-invalid", "true");
  });

  it("asks for a new email instead of a password when the link does not work", async () => {
    renderPage({ valid: false });

    expect(await screen.findByRole("heading", { name: "リンクが使えません" })).toBeInTheDocument();
    expect(screen.queryByLabelText("新しいパスワード")).toBeNull();
    expect(screen.getByRole("link", { name: "もう一度メールを送る" })).toHaveAttribute("href", "/forgot-password");
  });
});
