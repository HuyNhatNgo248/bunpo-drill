import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { loadCatalog } from "~/lib/i18n";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { AppHeader } from ".";

const linkTo = (name: string) => screen.queryByRole("link", { name });

describe("AppHeader", () => {
  it("links the brand home", async () => {
    renderRoute(<AppHeader />);

    expect(await screen.findByRole("link", { name: /文法ドリル/ })).toHaveAttribute("href", "/");
  });

  it("shows no back link and no account link unless asked", async () => {
    renderRoute(<AppHeader />);
    await screen.findByRole("link", { name: /文法ドリル/ });

    expect(linkTo("← Mock tests")).toBeNull();
    expect(linkTo("Account")).toBeNull();
  });

  it("links back to the list with `back`, and to the account page with `account`", async () => {
    renderRoute(
      <>
        <AppHeader back />
        <AppHeader account />
      </>,
    );

    expect(await screen.findByRole("link", { name: "← Mock tests" })).toHaveAttribute("href", "/");
    expect(linkTo("Account")).toHaveAttribute("href", "/account");
  });

  it("logs out through the logout route with `account`", async () => {
    const { action, requests } = recordingAction();
    renderRoute(<AppHeader account />, { routes: [{ path: "/logout", action }] });

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(requests).toEqual([{ method: "POST", path: "/logout", body: null }]));
  });

  it("shows the mobile title with a back chevron and the extra content", async () => {
    renderRoute(<AppHeader back mobileTitle="第1週 1日目" mobileAside={<span>1 / 3</span>} />);

    expect(await screen.findByText("第1週 1日目")).toBeInTheDocument();
    expect(linkTo("Back to the mock tests")).toHaveAttribute("href", "/");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  describe("in Japanese", () => {
    afterEach(() => loadCatalog("en"));

    it("speaks the language picked with the switch", async () => {
      await loadCatalog("ja");
      renderRoute(<AppHeader account />);

      expect(await screen.findByRole("link", { name: "アカウント" })).toHaveAttribute("href", "/account");
      expect(screen.getByRole("button", { name: "ログアウト" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "言語：日本語" })).toBeInTheDocument();
    });
  });
});
