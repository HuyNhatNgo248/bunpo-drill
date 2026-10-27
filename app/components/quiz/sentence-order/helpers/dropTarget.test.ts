import { afterEach, describe, expect, it, vi } from "vitest";
import { dropTargetAt } from "./dropTarget";

/** A drop zone the way SlotButton and Bank mark one, with a child the pointer can be over. */
function buildZone(questionId: string, drop: string) {
  const zone = document.createElement("div");
  zone.dataset.drop = drop;
  zone.dataset.question = questionId;
  const child = document.createElement("span");
  zone.append(child);
  document.body.append(zone);
  return child;
}

/** happy-dom does no layout, so the test says which elements are under the point. */
function stubElementsAtPoint(elements: Element[]) {
  document.elementsFromPoint = vi.fn(() => elements);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("dropTargetAt", () => {
  it("finds the slot under the point", () => {
    stubElementsAtPoint([buildZone("q2", "3")]);

    expect(dropTargetAt("q2", 10, 10)).toEqual({ slot: 3 });
  });

  it("finds the bank under the point", () => {
    stubElementsAtPoint([buildZone("q2", "bank")]);

    expect(dropTargetAt("q2", 10, 10)).toEqual({ bank: true });
  });

  it("skips a zone of another question, so a piece cannot land in another sentence", () => {
    stubElementsAtPoint([buildZone("q5", "0"), buildZone("q2", "1")]);

    expect(dropTargetAt("q2", 10, 10)).toEqual({ slot: 1 });
  });

  it("returns null when no zone of the question is under the point", () => {
    stubElementsAtPoint([document.body]);

    expect(dropTargetAt("q2", 10, 10)).toBeNull();
  });
});
