import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { AuthCard } from "./AuthCard";

function renderCard() {
  renderRoute(
    <AuthCard title="ログイン" description="ユーザー名とパスワードを入力してください。">
      <button type="button">ログイン</button>
    </AuthCard>,
    { url: "/login" },
  );
}

describe("AuthCard", () => {
  it("puts the form beside the notebook, with what the app is for under the drawing", async () => {
    renderCard();

    const card = (await screen.findByRole("heading", { name: "ログイン" })).closest("[data-slot=card]")!;
    expect(card.querySelector("[data-hairline]")).not.toBeNull();
    expect(card).toHaveTextContent("文法ノートから作る、JLPT形式の模擬試験。");
    expect(card).toContainElement(screen.getByRole("button", { name: "ログイン" }));
  });
});
