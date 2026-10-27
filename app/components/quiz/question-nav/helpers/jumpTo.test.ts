import { afterEach, describe, expect, it, vi } from "vitest";
import { questionAnchor } from "~/lib/sections";
import { jumpTo } from "./jumpTo";

/** The card of question `num`, as QuestionCard renders it. */
function buildCard(num: number) {
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

describe("jumpTo", () => {
  it("scrolls the card to the top at once and focuses it", () => {
    const card = buildCard(12);

    jumpTo(12);

    expect(card.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
    expect(document.activeElement).toBe(card);
  });

  it("does nothing for a question that has no card", () => {
    expect(() => jumpTo(99)).not.toThrow();
  });
});
