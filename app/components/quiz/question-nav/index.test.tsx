import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { questionAnchor } from "~/lib/sections";
import { QuestionNav } from ".";
import { renderWithCatalog } from "#tests/helpers/render";

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
    renderWithCatalog(<QuestionNav sections={SECTIONS} answered={new Set(["q2"])} />);

    expect(screen.getByRole("navigation", { name: "Question list" })).toHaveTextContent("文法形式の判断 · Grammar form");
    expect(screen.getByRole("button", { name: "Question 1 (unanswered)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Question 2 (answered)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Question 3 (unanswered)" })).toBeInTheDocument();
  });

  it("jumps to the card of a picked number", async () => {
    renderWithCatalog(<QuestionNav sections={SECTIONS} answered={new Set()} />);
    const card = addCard(3);

    await userEvent.click(screen.getByRole("button", { name: "Question 3 (unanswered)" }));

    expect(card.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(card);
  });
});
