import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { Welcome } from ".";
import { SAMPLES } from "./helpers/samples";

/** Picks the choice named `choice` of the sample question on screen. */
async function pick(choice: string) {
  const group = await screen.findByRole("radiogroup");
  await userEvent.click(within(group).getByRole("radio", { name: new RegExp(choice) }));
}

/** Answers every sample right, then opens the score. */
async function answerAll() {
  for (const [i, sample] of SAMPLES.entries()) {
    await pick(sample.choices[sample.answer]);
    await userEvent.click(screen.getByRole("button", { name: i === SAMPLES.length - 1 ? "結果を見る" : "次の問題" }));
  }
}

describe("Welcome", () => {
  it("pitches the app and links to sign-up and sign-in", async () => {
    renderRoute(<Welcome />, { url: "/welcome" });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("自分の文法ノートから、本番形式の模擬試験。");
    for (const link of screen.getAllByRole("link", { name: "アカウントを作成" })) {
      expect(link).toHaveAttribute("href", "/login?mode=signup");
    }
    expect(screen.getAllByRole("link", { name: "ログイン" })[0]).toHaveAttribute("href", "/login");
  });

  it("marks a right answer, fills the blank, and says why", async () => {
    renderRoute(<Welcome />, { url: "/welcome" });

    await pick("かいがあって");

    expect(screen.getByText("正解！")).toBeInTheDocument();
    expect(screen.getByText("〜かいがあって")).toBeInTheDocument();
    expect(screen.getByText("（正解）").closest("li")).toHaveTextContent("かいがあって");
  });

  it("shows the right answer after a wrong one", async () => {
    renderRoute(<Welcome />, { url: "/welcome" });

    await pick("かいもなく");

    expect(screen.getByText("正解は 3「かいがあって」")).toBeInTheDocument();
    expect(screen.getByText("（あなたの解答）").closest("li")).toHaveTextContent("かいもなく");
  });

  it("gives the score after the last question, and starts again", async () => {
    renderRoute(<Welcome />, { url: "/welcome" });

    await answerAll();

    expect(screen.getByText("おつかれさまでした")).toBeInTheDocument();
    expect(screen.getByText(String(SAMPLES.length), { selector: "strong" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "もう一度" }));
    expect(screen.getByText(`1 / ${SAMPLES.length}`)).toBeInTheDocument();
  });
});
