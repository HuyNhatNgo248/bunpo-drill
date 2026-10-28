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
    await userEvent.click(screen.getByRole("button", { name: i === SAMPLES.length - 1 ? "See your score" : "Next question" }));
  }
}

describe("Welcome", () => {
  it("counts down to the next exam in its own section", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "The next JLPT" });
    expect(section).toHaveTextContent("Sunday, December 6, 2026");
    expect(section).toHaveTextContent("in 39 days");
    expect(section).toHaveTextContent("you can take 39 tests before the exam");
  });

  it("ends with a footer that says it is not the official JLPT, and links to it", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    const footer = await screen.findByRole("contentinfo");
    expect(footer).toHaveTextContent("継続は力なり");
    expect(footer).toHaveTextContent("Not an official JLPT service");
    expect(within(footer).getByRole("link", { name: "jlpt.jp" })).toHaveAttribute("href", "https://www.jlpt.jp/");
  });

  it("says when it is the exam day, with no count", async () => {
    renderRoute(<Welcome exam={{ date: "2026-12-06", daysLeft: 0 }} />, { url: "/welcome" });

    const section = await screen.findByRole("region", { name: "The next JLPT" });
    expect(section).toHaveTextContent("It's exam day today");
    expect(section).not.toHaveTextContent(/in \d+ day/);
  });

  it("pitches the app and links to sign-up and sign-in", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Real-format mock tests, from your own grammar notes.");
    for (const link of screen.getAllByRole("link", { name: "Create account" })) {
      expect(link).toHaveAttribute("href", "/signup");
    }
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute("href", "/signin");
  });

  it("marks a right answer, fills the blank, and says why", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    await pick("かいがあって");

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("〜かいがあって")).toBeInTheDocument();
    expect(screen.getByText("(correct)").closest("li")).toHaveTextContent("かいがあって");
  });

  it("shows the right answer after a wrong one", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    await pick("かいもなく");

    expect(screen.getByText("The answer is 3 “かいがあって”")).toBeInTheDocument();
    expect(screen.getByText("(your answer)").closest("li")).toHaveTextContent("かいもなく");
  });

  it("gives the score after the last question, and starts again", async () => {
    renderRoute(<Welcome exam={EXAM} />, { url: "/welcome" });

    await answerAll();

    expect(screen.getByText("Nice work")).toBeInTheDocument();
    expect(screen.getByText(String(SAMPLES.length), { selector: "strong" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText(`1 / ${SAMPLES.length}`)).toBeInTheDocument();
  });
});
