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

    await userEvent.type(await screen.findByLabelText("New password"), "a new passphrase");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() =>
      expect(requests).toEqual([{ method: "POST", path: "/reset-password", body: { token: TOKEN, password: "a new passphrase" } }]),
    );
  });

  it("shows the error of the last try", async () => {
    renderPage({ error: "Use a password of at least 8 characters." });

    expect(await screen.findByRole("alert")).toHaveTextContent("Use a password of at least 8 characters.");
    expect(screen.getByLabelText("New password")).toHaveAttribute("aria-invalid", "true");
  });

  it("asks for a new email instead of a password when the link does not work", async () => {
    renderPage({ valid: false });

    expect(await screen.findByRole("heading", { name: "This link can't be used" })).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByRole("link", { name: "Send the email again" })).toHaveAttribute("href", "/forgot-password");
  });
});
