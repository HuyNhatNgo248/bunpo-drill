import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import { loadCatalog } from "~/lib/i18n";
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

    const nav = screen.getByRole("navigation", { name: "Question list" });
    expect(nav).toHaveTextContent("Part 1Grammar form");
    expect(nav).not.toHaveTextContent("文法形式の判断");
    expect(screen.getByRole("button", { name: "Question 1 (unanswered)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Question 2 (answered)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Question 3 (unanswered)" })).toBeInTheDocument();
  });

  describe("on a Japanese page", () => {
    afterEach(() => loadCatalog("en"));

    it("names each section by its official Japanese name", async () => {
      await loadCatalog("ja");
      renderWithCatalog(<QuestionNav sections={SECTIONS} answered={new Set()} />);

      expect(screen.getByText("文法形式の判断")).toHaveAttribute("lang", "ja");
      expect(screen.queryByText("Grammar form")).toBeNull();
    });
  });

  it("jumps to the card of a picked number", async () => {
    renderWithCatalog(<QuestionNav sections={SECTIONS} answered={new Set()} />);
    const card = addCard(3);

    await userEvent.click(screen.getByRole("button", { name: "Question 3 (unanswered)" }));

    expect(card.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(card);
  });
});
