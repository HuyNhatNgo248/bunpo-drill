import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { Login } from ".";

/** The sign-in page (or with `signup`, the sign-up page) at `url`, with the action that its form posts to. */
function renderLogin(url = "/signin", error?: string) {
  const { action, requests } = recordingAction();
  renderRoute(<Login signup={url.startsWith("/signup")} error={error} />, { url, action });
  return requests;
}

describe("Login", () => {
  it("signs in with a name and a password", async () => {
    const requests = renderLogin(
      "/signin?redirectTo=%2Ftests%2F20261027-abc123",
    );

    await userEvent.type(
      await screen.findByRole("textbox", { name: "ユーザー名またはメールアドレス" }),
      "Huy",
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "correct horse");
    await userEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() =>
      expect(requests).toEqual([
        {
          method: "POST",
          path: "/signin",
          body: {
            redirectTo: "/tests/20261027-abc123",
            name: "Huy",
            password: "correct horse",
          },
        },
      ]),
    );
  });

  it("links to sign-up, and keeps the page to return to", async () => {
    renderLogin("/signin?redirectTo=%2Faccount");

    expect(
      await screen.findByRole("link", { name: "アカウントを作成" }),
    ).toHaveAttribute("href", "/signup?redirectTo=%2Faccount");
  });

  it("links to the page for a forgotten password", async () => {
    renderLogin();

    expect(await screen.findByRole("link", { name: "パスワードを忘れた場合" })).toHaveAttribute("href", "/forgot-password");
  });

  describe("sign-up", () => {
    it("asks for the email that a password reset goes to, and shows no forgot link", async () => {
      renderLogin("/signup");

      expect(await screen.findByRole("textbox", { name: "メールアドレス" })).toBeRequired();
      expect(screen.queryByRole("link", { name: "パスワードを忘れた場合" })).toBeNull();
    });

    it("sends the new account to the sign-up page", async () => {
      const requests = renderLogin("/signup");

      expect(
        await screen.findByRole("heading", { name: "アカウント作成" }),
      ).toBeInTheDocument();
      await userEvent.type(
        screen.getByRole("textbox", { name: "ユーザー名" }),
        "Mai",
      );
      await userEvent.type(
        screen.getByRole("textbox", { name: "メールアドレス" }),
        "mai@example.com",
      );
      await userEvent.type(
        screen.getByLabelText("パスワード"),
        "a long passphrase",
      );
      await userEvent.click(
        screen.getByRole("button", { name: "アカウントを作成" }),
      );

      await waitFor(() =>
        expect(requests[0]).toMatchObject({ path: "/signup", body: { name: "Mai", email: "mai@example.com" } }),
      );
    });

    it("links back to sign-in", async () => {
      renderLogin("/signup");

      expect(
        await screen.findByRole("link", { name: "ログイン" }),
      ).toHaveAttribute("href", "/signin?redirectTo=%2F");
    });
  });

  describe("a failed try", () => {
    it("shows the error, and ties it to the fields", async () => {
      renderLogin("/signin", "ユーザー名（メールアドレス）かパスワードが違います。");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "ユーザー名（メールアドレス）かパスワードが違います。",
      );
      expect(
        screen.getByRole("textbox", { name: "ユーザー名またはメールアドレス" }),
      ).toHaveAccessibleDescription("ユーザー名（メールアドレス）かパスワードが違います。");
      expect(screen.getByLabelText("パスワード")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
  });
});
