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
  it("puts the form beside the notebook, with what the app is for under the drawing", async () => {
    renderCard();

    const card = (await screen.findByRole("heading", { name: "Sign in" })).closest("[data-slot=card]")!;
    expect(card.querySelector("[data-hairline]")).not.toBeNull();
    expect(card).toHaveTextContent("JLPT-style mock tests, made from your grammar notes.");
    expect(card).toContainElement(screen.getByRole("button", { name: "Sign in" }));
  });
});
