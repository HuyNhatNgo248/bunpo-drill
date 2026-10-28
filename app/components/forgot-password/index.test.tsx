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

    await userEvent.type(await screen.findByRole("textbox", { name: "Email address" }), "huy@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send the link" }));

    await waitFor(() => expect(requests).toEqual([{ method: "POST", path: "/forgot-password", body: { email: "huy@example.com" } }]));
  });

  it("says that a link went out, without saying whether an account has the email", async () => {
    renderPage({ sent: "huy@example.com" });

    expect(await screen.findByRole("status")).toHaveTextContent("If there's an account for huy@example.com, we sent the link.");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows the error of a value that is not an email, and marks the field", async () => {
    renderPage({ error: "That email address doesn't look right." });

    expect(await screen.findByRole("alert")).toHaveTextContent("That email address doesn't look right.");
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveAttribute("aria-invalid", "true");
  });

  it("links back to the login page", async () => {
    renderPage();

    expect(await screen.findByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/signin");
  });
});
