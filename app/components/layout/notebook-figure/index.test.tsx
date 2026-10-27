import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotebookFigure } from ".";

/** The stage the drawing mounts into. */
const stageOf = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-hairline]")!;

describe("NotebookFigure", () => {
  it("keeps the drawing out of the accessibility tree, because it is decoration", () => {
    const { container } = render(<NotebookFigure />);

    expect(stageOf(container)).toHaveAttribute("aria-hidden", "true");
  });

  it("holds a 5:4 box before the drawing mounts, so the page does not move", () => {
    const { container } = render(<NotebookFigure className="max-w-60" />);

    expect(stageOf(container)).toHaveClass("aspect-5/4", "max-w-60");
  });

  it("draws the notebook, its pencil and its six tabs into one svg", () => {
    const { container } = render(<NotebookFigure />);

    const svg = stageOf(container).querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "0 0 400 320");
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(20);
    // the weeks as dots: 1 + 2 + … + 6
    expect(svg.querySelectorAll("circle")).toHaveLength(21);
    // at rest, one tab carries the bright edge
    expect(svg.querySelectorAll(".hi")).toHaveLength(1);
  });

  it("tells the page what is under the pointer, which is nothing at first", () => {
    const onRead = vi.fn();

    render(<NotebookFigure onRead={onRead} />);

    expect(onRead).toHaveBeenLastCalledWith("rest");
  });

  it("takes the drawing down when the page leaves", () => {
    const { container, unmount } = render(<NotebookFigure />);
    const stage = stageOf(container);

    unmount();

    expect(stage.querySelector("svg")).toBeNull();
  });
});
