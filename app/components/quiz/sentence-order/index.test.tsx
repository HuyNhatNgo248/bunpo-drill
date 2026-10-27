import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { SentenceOrder } from ".";
import type { OrderQuestion, Slots } from "./types";

/** q2 of the built quiz: pieces 練習した, 毎日, かいが, あって, with the ★ in slot 3. */
const QUESTION = buildQuizView().sections[1].groups[0].questions[0] as OrderQuestion;

/** The slots live in the quiz page, so the test holds them the same way. */
function Harness() {
  const [slots, setSlots] = useState<Slots | undefined>(undefined);
  return <SentenceOrder question={QUESTION} slots={slots} onChange={setSlots} />;
}

const tap = (name: string | RegExp) => userEvent.click(screen.getByRole("button", { name }));

describe("SentenceOrder", () => {
  it("shows the sentence around 4 empty slots, with the ★ slot marked", () => {
    render(<Harness />);

    expect(screen.getByText("彼は")).toBeInTheDocument();
    expect(screen.getByText("合格した。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "空欄1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "★の空欄" })).toBeInTheDocument();
  });

  it("puts a tapped piece in the next empty slot, and greys it out in the bank", async () => {
    render(<Harness />);

    await tap("毎日");
    await tap("かいが");

    expect(screen.getByRole("button", { name: "空欄1：毎日（タップで外す）" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "空欄2：かいが（タップで外す）" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "毎日（配置済み）" })).toBeDisabled();
  });

  it("sends the piece of a tapped slot back to the bank", async () => {
    render(<Harness />);
    await tap("毎日");

    await tap("空欄1：毎日（タップで外す）");

    expect(screen.getByRole("button", { name: "空欄1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "毎日" })).toBeEnabled();
  });

  it("fills the ★ slot like the others", async () => {
    render(<Harness />);

    await tap("毎日");
    await tap("練習した");
    await tap("かいが");

    expect(screen.getByRole("button", { name: "★の空欄：かいが（タップで外す）" })).toBeInTheDocument();
  });
});
