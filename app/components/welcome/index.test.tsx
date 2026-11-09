import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import type { TrialSummary } from "~/lib/views";
import { Welcome } from ".";
import { SAMPLES } from "./helpers/samples";

const EXAM = { date: "2026-12-06", daysLeft: 39 };

const TRIALS: TrialSummary[] = [
  { id: "n3-1", kind: "grammar", title: "総合 1", level: "N3", questionCount: 45 },
  { id: "n3-2", kind: "grammar", title: "総合 2", level: "N3", questionCount: 45 },
  { id: "n2-1", kind: "grammar", title: "総合 1", level: "N2", questionCount: 45 },
  { id: "kanji-n2-1", kind: "kanji", title: "総合 1", level: "N2", questionCount: 45 },
  { id: "reading-n2-1", kind: "reading", title: "総合 1", level: "N2", questionCount: 12 },
];

/** Picks the choice named `choice` of the sample question on screen. */
async function pick(choice: string) {
  const group = await screen.findByRole("radiogroup");
  await userEvent.click(within(group).getByRole("radio", { name: new RegExp(choice) }));
}

/** The sample card in front; the cards behind it are aria-hidden. */
function card() {
  return screen.getByRole("group", { name: "Sample question" });
}

/** Answers every sample right, then opens the score. */
async function answerAll() {
  for (const [i, sample] of SAMPLES.entries()) {
    await pick(sample.choices[sample.answer]);
    await userEvent.click(screen.getByRole("button", { name: i === SAMPLES.length - 1 ? "See your score" : "Next question" }));
  }
}

describe("Welcome", () => {
  it("counts down to the next exam in its own section", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "The next JLPT" });
    expect(section).toHaveTextContent("Sunday, December 6, 2026");
    expect(section).toHaveTextContent("in 39 days");
    expect(section).toHaveTextContent("you can take 39 tests before the exam");
    expect(within(section).getByRole("link", { name: "Start practicing today" })).toHaveAttribute("href", "/signup");
  });

  it("lists a subject's trial tests at the level picked, N2 first, each opening its quiz", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "Try a practice set, no account needed" });
    expect(within(section).getByRole("tab", { name: "Grammar" })).toHaveAttribute("aria-selected", "true");
    expect(within(section).getByRole("link", { name: "N2 Grammar 総合 1" })).toHaveAttribute("href", "/try/n2-1");

    await userEvent.click(within(section).getByRole("button", { name: "Level: N2" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "N3" }));
    expect(within(section).getByRole("link", { name: "N3 Grammar 総合 1" })).toHaveAttribute("href", "/try/n3-1");
    expect(within(section).getByRole("link", { name: "N3 Grammar 総合 2" })).toHaveAttribute("href", "/try/n3-2");
    expect(within(within(section).getByRole("link", { name: "N3 Grammar 総合 1" }).closest("li")!).getByText("45 questions")).toBeInTheDocument();
  });

  it("switches to the kanji and reading tests, keeping the level where the subject has it", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "Try a practice set, no account needed" });
    await userEvent.click(within(section).getByRole("tab", { name: "Kanji" }));
    expect(within(section).getByRole("link", { name: "N2 Kanji 総合 1" })).toHaveAttribute("href", "/try/kanji-n2-1");

    await userEvent.click(within(section).getByRole("tab", { name: "Reading" }));
    expect(within(section).getByRole("link", { name: "N2 Reading 総合 1" })).toHaveAttribute("href", "/try/reading-n2-1");
  });

  it("shows each subject's formats in its own tab", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "The same formats as the real exam" });
    expect(section).toHaveTextContent("文法形式の判断");
    await userEvent.click(within(section).getByRole("tab", { name: "Kanji" }));
    expect(section).toHaveTextContent("漢字読み");
    expect(section).toHaveTextContent("表記");
    await userEvent.click(within(section).getByRole("tab", { name: "Reading" }));
    for (const title of ["内容理解（短文）", "内容理解（中文）", "統合理解", "主張理解（長文）", "情報検索"]) expect(section).toHaveTextContent(title);
  });

  it("ends with a footer that says it is not the official JLPT, and links to it", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    const footer = await screen.findByRole("contentinfo");
    expect(footer).toHaveTextContent("継続は力なり");
    expect(footer).toHaveTextContent("Not an official JLPT service");
    expect(within(footer).getByRole("link", { name: "jlpt.jp" })).toHaveAttribute("href", "https://www.jlpt.jp/");
  });

  it("says when it is the exam day, with no count", async () => {
    renderRoute(<Welcome exam={{ date: "2026-12-06", daysLeft: 0 }} trials={TRIALS} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "The next JLPT" });
    expect(section).toHaveTextContent("It's exam day today");
    expect(section).not.toHaveTextContent(/in \d+ day/);
  });

  it("pitches the app and links to sign-up and sign-in", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Practice for the JLPT in the real test's format.");
    for (const link of screen.getAllByRole("link", { name: "Create account" })) {
      expect(link).toHaveAttribute("href", "/signup");
    }
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute("href", "/signin");
  });

  it("marks a right answer, fills the blank, and says why", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    await pick("かいがあって");

    expect(card()).toHaveTextContent("Correct!");
    expect(card()).toHaveTextContent("練習した（かいがあって）、合格できた。");
    expect(card()).toHaveTextContent("〜かいがあって");
  });

  it("shows the right answer after a wrong one", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    await pick("かいもなく");

    expect(card()).toHaveTextContent("The answer is 3 “かいがあって”");
    expect(card()).toHaveTextContent("練習した（かいもなく）、合格できた。");
  });

  it("gives the score after the last question, and starts again", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    await answerAll();

    expect(screen.getByText("Nice work")).toBeInTheDocument();
    expect(within(card()).getByText(String(SAMPLES.length), { selector: "strong" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText(`1 / ${SAMPLES.length}`)).toBeInTheDocument();
  });
});
