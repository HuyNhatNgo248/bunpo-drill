import { describe, expect, it } from "vitest";
import { loadFigure } from "./loadFigure";

describe("loadFigure", () => {
  it("runs the kernel and gives the notebook figure with its slider range", () => {
    const { HL, figure } = loadFigure();

    expect(typeof HL.inject).toBe("function");
    expect(figure).toMatchObject({ name: "tabs", range: [20, 34, 46] });
    expect(typeof figure.mount).toBe("function");
  });

  it("runs them once, so every page shares one kernel and its one frame loop", () => {
    expect(loadFigure()).toBe(loadFigure());
  });
});
