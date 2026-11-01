import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import type { TrialSummary } from "~/lib/views";
import { Welcome } from ".";
import { SAMPLES } from "./helpers/samples";

const EXAM = { date: "2026-12-06", daysLeft: 39 };

const TRIALS: TrialSummary[] = [
  { id: "n3-1", title: "総合テスト 1", level: "N3", questionCount: 45, patternCount: 44 },
  { id: "n3-2", title: "総合テスト 2", level: "N3", questionCount: 45, patternCount: 44 },
  { id: "n2-1", title: "総合テスト 1", level: "N2", questionCount: 45, patternCount: 24 },
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

  it("lists the trial tests by level, each opening its quiz", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "Try a full mock test, no account needed" });
    expect(within(section).getByRole("link", { name: "N3 総合テスト 1" })).toHaveAttribute("href", "/try/n3-1");
    expect(within(section).getByRole("link", { name: "N3 総合テスト 2" })).toHaveAttribute("href", "/try/n3-2");
    expect(within(section).getByRole("link", { name: "N2 総合テスト 1" })).toHaveAttribute("href", "/try/n2-1");
  });

  it("gives each level's grammar points, roughly, and the size of each trial test", async () => {
    renderRoute(<Welcome exam={EXAM} trials={TRIALS} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "Try a full mock test, no account needed" });
    expect(section).toHaveTextContent("About 90 grammar points");
    expect(section).toHaveTextContent("About 20 grammar points");
    expect(within(within(section).getByRole("link", { name: "N3 総合テスト 1" }).closest("li")!).getByText("45 questions")).toBeInTheDocument();
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

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Practice JLPT grammar in the real test's format.");
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
