import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { questionAnchor } from "~/lib/sections";
import { QuestionNav } from ".";

const SECTIONS = buildQuizView().sections;

/** The card that a number jumps to, as QuestionCard renders it. */
function addCard(num: number) {
  const card = document.createElement("div");
  card.id = questionAnchor(num);
  card.tabIndex = -1;
  card.scrollIntoView = vi.fn();
  document.body.append(card);
  return card;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("QuestionNav", () => {
  it("lists every question by section, and marks the answered ones", () => {
    render(<QuestionNav sections={SECTIONS} answered={new Set(["q2"])} />);

    expect(screen.getByRole("navigation", { name: "問題一覧" })).toHaveTextContent("文法形式の判断");
    expect(screen.getByRole("button", { name: "問題1（未回答）" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "問題2（回答済み）" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "問題3（未回答）" })).toBeInTheDocument();
  });

  it("jumps to the card of a picked number", async () => {
    render(<QuestionNav sections={SECTIONS} answered={new Set()} />);
    const card = addCard(3);

    await userEvent.click(screen.getByRole("button", { name: "問題3（未回答）" }));

    expect(card.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(card);
  });
});
