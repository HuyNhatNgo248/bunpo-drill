import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("draws bold, italic, struck, code and links inside a line", () => {
    const { container } = render(<Markdown text={"**相場** is *market price*, not ~~そうじょう~~: `そうば`. [Jisho](https://jisho.org/search/相場)"} />);

    expect(container.querySelector("strong")).toHaveTextContent("相場");
    expect(container.querySelector("em")).toHaveTextContent("market price");
    expect(container.querySelector("s")).toHaveTextContent("そうじょう");
    expect(container.querySelector("code")).toHaveTextContent("そうば");
    expect(screen.getByRole("link", { name: "Jisho" })).toHaveAttribute("href", "https://jisho.org/search/相場");
  });

  it("draws marks inside marks, and leaves a lone asterisk alone", () => {
    const { container } = render(<Markdown text={"**very *rare* word** and 2 * 3"} />);

    expect(container.querySelector("strong em")).toHaveTextContent("rare");
    expect(container).toHaveTextContent("very rare word and 2 * 3");
  });

  it("draws lists, headings and paragraphs, keeping a line break inside a paragraph", () => {
    const { container } = render(<Markdown text={"# 読み\nそうば\nmarket price\n\n- 相場が上がる\n- 相場が下がる\n\n1. first\n2. second"} />);

    expect(container.querySelector("p.font-semibold")).toHaveTextContent("読み");
    expect(container.querySelector("br")).not.toBeNull();
    expect([...container.querySelectorAll("ul li")].map((li) => li.textContent)).toEqual(["相場が上がる", "相場が下がる"]);
    expect([...container.querySelectorAll("ol li")].map((li) => li.textContent)).toEqual(["first", "second"]);
  });

  it("keeps links to anything but http(s) and mailto as text, and HTML as text", () => {
    const { container } = render(<Markdown text={"[click](javascript:alert(1)) <b>bold</b>"} />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container).toHaveTextContent("[click](javascript:alert(1)) <b>bold</b>");
  });
});
