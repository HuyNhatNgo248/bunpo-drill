import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

    expect(linkTo("← テスト一覧")).toBeNull();
    expect(linkTo("アカウント")).toBeNull();
  });

  it("links back to the list with `back`, and to the account page with `account`", async () => {
    renderRoute(
      <>
        <AppHeader back />
        <AppHeader account />
      </>,
    );

    expect(await screen.findByRole("link", { name: "← テスト一覧" })).toHaveAttribute("href", "/");
    expect(linkTo("アカウント")).toHaveAttribute("href", "/account");
  });

  it("shows the mobile title with a back chevron and the extra content", async () => {
    renderRoute(<AppHeader back mobileTitle="第1週 1日目" mobileAside={<span>1 / 3</span>} />);

    expect(await screen.findByText("第1週 1日目")).toBeInTheDocument();
    expect(linkTo("テスト一覧に戻る")).toHaveAttribute("href", "/");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
});
