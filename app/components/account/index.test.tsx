import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { Account } from ".";
import type { AccountResult } from "./types";

const NAME = "Huy";

/** The account page, with the actions that its forms post to. */
function renderAccount(result?: AccountResult) {
  const page = recordingAction();
  const logout = recordingAction();
  renderRoute(<Account name={NAME} result={result} />, {
    url: "/account",
    action: page.action,
    routes: [{ path: "/logout", action: logout.action }],
  });
  return { page: page.requests, logout: logout.requests };
}

/** The card of a form, found by its heading. */
const cardOf = (heading: string) => within(screen.getByRole("heading", { name: heading }).closest<HTMLElement>("[data-slot=card]")!);

describe("Account", () => {
  it("shows the current name, ready to change", async () => {
    renderAccount();

    expect(await screen.findByRole("textbox", { name: "ユーザー名" })).toHaveValue(NAME);
  });

  it("sends a new name with the intent of the name form", async () => {
    const { page } = renderAccount();
    const field = await screen.findByRole("textbox", { name: "ユーザー名" });

    await userEvent.clear(field);
    await userEvent.type(field, "Mai");
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(page).toEqual([{ method: "POST", path: "/account", body: { intent: "name", name: "Mai" } }]));
  });

  it("sends the current and the new password with the intent of the password form", async () => {
    const { page } = renderAccount();

    await userEvent.type(await screen.findByLabelText("現在のパスワード"), "old password");
    await userEvent.type(screen.getByLabelText("新しいパスワード"), "new password");
    await userEvent.click(screen.getByRole("button", { name: "パスワードを変更" }));

    await waitFor(() =>
      expect(page[0]?.body).toEqual({ intent: "password", current: "old password", next: "new password" }),
    );
  });

  describe("the answer of a form", () => {
    it("shows an error under the form it is for only, and marks the field", async () => {
      renderAccount({ form: "name", error: "このユーザー名はもう使われています。" });
      await screen.findByRole("heading", { name: "ユーザー名" });

      expect(cardOf("ユーザー名").getByRole("alert")).toHaveTextContent("このユーザー名はもう使われています。");
      expect(cardOf("パスワード").queryByRole("alert")).toBeNull();
      expect(screen.getByRole("textbox", { name: "ユーザー名" })).toHaveAttribute("aria-invalid", "true");
    });

    it("shows a saved message under its form", async () => {
      renderAccount({ form: "password", saved: "パスワードを変更しました。" });
      await screen.findByRole("heading", { name: "パスワード" });

      expect(cardOf("パスワード").getByRole("status")).toHaveTextContent("パスワードを変更しました。");
      expect(cardOf("ユーザー名").queryByRole("status")).toBeNull();
    });
  });

  it("logs out through the logout route", async () => {
    const { logout } = renderAccount();

    await userEvent.click(await screen.findByRole("button", { name: "ログアウト" }));

    await waitFor(() => expect(logout).toEqual([{ method: "POST", path: "/logout", body: null }]));
  });
});
