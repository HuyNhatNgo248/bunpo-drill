import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { Welcome } from ".";
import { SAMPLES } from "./helpers/samples";

const EXAM = { date: "2026-12-06", daysLeft: 39 };

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
  it("counts down to the next exam in its own section", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "次の日本語能力試験（JLPT）" });
    expect(section).toHaveTextContent("2026年12月6日（日）");
    expect(section).toHaveTextContent("あと39日");
    expect(section).toHaveTextContent("試験日までに39回解けます");
  });

  it("ends with a footer that says it is not the official JLPT, and links to it", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    const footer = await screen.findByRole("contentinfo");
    expect(footer).toHaveTextContent("継続は力なり");
    expect(footer).toHaveTextContent("公式サービスではありません");
    expect(within(footer).getByRole("link", { name: "jlpt.jp" })).toHaveAttribute("href", "https://www.jlpt.jp/");
  });

  it("says when it is the exam day, with no count", async () => {
    renderRoute(<Welcome exam={{ date: "2026-12-06", daysLeft: 0 }} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "次の日本語能力試験（JLPT）" });
    expect(section).toHaveTextContent("今日が試験日です");
    expect(section).not.toHaveTextContent("あと");
  });

  it("pitches the app and links to sign-up and sign-in", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("自分の文法ノートから、本番形式の模擬試験。");
    for (const link of screen.getAllByRole("link", { name: "アカウントを作成" })) {
      expect(link).toHaveAttribute("href", "/login?mode=signup");
    }
    expect(screen.getAllByRole("link", { name: "ログイン" })[0]).toHaveAttribute("href", "/login");
  });

  it("marks a right answer, fills the blank, and says why", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    await pick("かいがあって");

    expect(screen.getByText("正解！")).toBeInTheDocument();
    expect(screen.getByText("〜かいがあって")).toBeInTheDocument();
    expect(screen.getByText("（正解）").closest("li")).toHaveTextContent("かいがあって");
  });

  it("shows the right answer after a wrong one", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    await pick("かいもなく");

    expect(screen.getByText("正解は 3「かいがあって」")).toBeInTheDocument();
    expect(screen.getByText("（あなたの解答）").closest("li")).toHaveTextContent("かいもなく");
  });

  it("gives the score after the last question, and starts again", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    await answerAll();

    expect(screen.getByText("おつかれさまでした")).toBeInTheDocument();
    expect(screen.getByText(String(SAMPLES.length), { selector: "strong" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "もう一度" }));
    expect(screen.getByText(`1 / ${SAMPLES.length}`)).toBeInTheDocument();
  });
});
