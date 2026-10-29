import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { AuthCard } from "./AuthCard";

function renderCard() {
  renderRoute(
    <AuthCard title="Sign in" description="ユーザー名とパスワードを入力してください。">
      <button type="button">Sign in</button>
    </AuthCard>,
    { url: "/signin" },
  );
}

describe("AuthCard", () => {
  it("puts the title and the form in one card", async () => {
    renderCard();

    const card = (await screen.findByRole("heading", { name: "Sign in" })).closest("[data-slot=card]")!;
    expect(card).toHaveTextContent("ユーザー名とパスワードを入力してください。");
    expect(card).toContainElement(screen.getByRole("button", { name: "Sign in" }));
  });
});
