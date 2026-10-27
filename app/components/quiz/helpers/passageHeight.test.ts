import { afterEach, describe, expect, it, vi } from "vitest";
import { trackPassageHeight } from "./passageHeight";

/** A ResizeObserver that reports one resize as soon as it observes, and records a disconnect. */
class FakeResizeObserver {
  static disconnected = 0;
  constructor(private readonly report: () => void) {}
  observe() {
    this.report();
  }
  disconnect() {
    FakeResizeObserver.disconnected += 1;
  }
}

/** A passage card inside its box, with the height that a browser lays it out at. */
function buildCard(height: number) {
  const box = document.createElement("div");
  const card = document.createElement("div");
  box.append(card);
  Object.defineProperty(card, "offsetHeight", { value: height });
  return { box, card };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackPassageHeight", () => {
  it("sets --passage-h on the box to the height of the card", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const { box, card } = buildCard(240);

    trackPassageHeight(card);

    expect(box.style.getPropertyValue("--passage-h")).toBe("240px");
  });

  it("stops watching when React calls the cleanup", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const { card } = buildCard(240);
    const before = FakeResizeObserver.disconnected;

    trackPassageHeight(card)();

    expect(FakeResizeObserver.disconnected).toBe(before + 1);
  });
});
