import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { Account } from ".";
import type { AccountResult } from "./types";

const NAME = "Huy";

const PASSWORD_TYPED = "my password";

/** The account page, with the actions that its forms post to. */
function renderAccount(result?: AccountResult, email: string | null = null) {
  const page = recordingAction();
  const logout = recordingAction();
  renderRoute(<Account name={NAME} email={email} result={result} />, {
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

    expect(await screen.findByRole("textbox", { name: "Username" })).toHaveValue(NAME);
  });

  it("sends a new name with the intent of the name form", async () => {
    const { page } = renderAccount();
    const field = await screen.findByRole("textbox", { name: "Username" });

    await userEvent.clear(field);
    await userEvent.type(field, "Mai");
    await userEvent.click(cardOf("Username").getByRole("button", { name: "Save" }));

    await waitFor(() => expect(page).toEqual([{ method: "POST", path: "/account", body: { intent: "name", name: "Mai" } }]));
  });

  it("sends the current and the new password with the intent of the password form", async () => {
    const { page } = renderAccount();

    await userEvent.type(await screen.findByLabelText("Current password"), "old password");
    await userEvent.type(screen.getByLabelText("New password"), "new password");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() =>
      expect(page[0]?.body).toEqual({ intent: "password", current: "old password", next: "new password" }),
    );
  });

  describe("the email form", () => {
    it("shows the saved email", async () => {
      renderAccount(undefined, "huy@example.com");

      expect(await screen.findByRole("textbox", { name: "Email address" })).toHaveValue("huy@example.com");
    });

    it("tells an account with no email why to add one", async () => {
      renderAccount();
      await screen.findByRole("heading", { name: "Email address" });

      expect(cardOf("Email address").getByText("None yet. Add one, and you can reset your password if you forget it.")).toBeInTheDocument();
    });

    it("sends the email with the intent of the email form", async () => {
      const { page } = renderAccount();

      await userEvent.type(await screen.findByRole("textbox", { name: "Email address" }), "huy@example.com");
      await userEvent.click(cardOf("Email address").getByRole("button", { name: "Save" }));

      await waitFor(() => expect(page).toEqual([{ method: "POST", path: "/account", body: { intent: "email", email: "huy@example.com" } }]));
    });

    it("shows the answer under the email form", async () => {
      renderAccount({ form: "email", error: "That email address is already in use." });
      await screen.findByRole("heading", { name: "Email address" });

      expect(cardOf("Email address").getByRole("alert")).toHaveTextContent("That email address is already in use.");
      expect(cardOf("Username").queryByRole("alert")).toBeNull();
    });
  });

  describe("the answer of a form", () => {
    it("shows an error under the form it is for only, and marks the field", async () => {
      renderAccount({ form: "name", error: "That username is already taken." });
      await screen.findByRole("heading", { name: "Username" });

      expect(cardOf("Username").getByRole("alert")).toHaveTextContent("That username is already taken.");
      expect(cardOf("Password").queryByRole("alert")).toBeNull();
      expect(screen.getByRole("textbox", { name: "Username" })).toHaveAttribute("aria-invalid", "true");
    });

    it("shows a saved message under its form", async () => {
      renderAccount({ form: "password", saved: "Password changed." });
      await screen.findByRole("heading", { name: "Password" });

      expect(cardOf("Password").getByRole("status")).toHaveTextContent("Password changed.");
      expect(cardOf("Username").queryByRole("status")).toBeNull();
    });
  });

  describe("the delete form", () => {
    it("asks first, then sends the password with the intent of the delete form", async () => {
      const { page } = renderAccount();
      const card = cardOf("Delete account");

      await userEvent.type(await card.findByLabelText("Password"), PASSWORD_TYPED);
      await userEvent.click(card.getByRole("button", { name: "Delete account" }));
      await userEvent.click(within(screen.getByRole("alertdialog", { name: "Delete your account?" })).getByRole("button", { name: "Delete account" }));

      await waitFor(() => expect(page).toEqual([{ method: "POST", path: "/account", body: { intent: "delete", password: PASSWORD_TYPED } }]));
    });

    it("sends nothing when the learner goes back", async () => {
      const { page } = renderAccount();
      const card = cardOf("Delete account");

      await userEvent.type(await card.findByLabelText("Password"), PASSWORD_TYPED);
      await userEvent.click(card.getByRole("button", { name: "Delete account" }));
      await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));

      expect(page).toEqual([]);
    });

    it("shows a wrong password under the delete form", async () => {
      renderAccount({ form: "delete", error: "Your current password is wrong." });

      expect(await cardOf("Delete account").findByRole("alert")).toHaveTextContent("Your current password is wrong.");
    });
  });

  it("logs out through the logout route", async () => {
    const { logout } = renderAccount();

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(logout).toEqual([{ method: "POST", path: "/logout", body: null }]));
  });
});
