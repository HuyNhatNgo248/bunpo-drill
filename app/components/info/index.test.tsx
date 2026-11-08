import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import type { TestKind } from "~/lib/views";
import { Info } from ".";

const show = (subject: TestKind) => renderRoute(<Info subject={subject} />, { url: `/info/${subject}` });

/** Picks the choice named `choice` of the sample question on screen. */
async function pick(choice: string, section = 0) {
  const group = (await screen.findAllByRole("radiogroup"))[section];
  await userEvent.click(within(group).getByRole("radio", { name: new RegExp(choice) }));
}

describe("Info", () => {
  it("shows the three grammar 問題 in the exam's order, with their size in a test", async () => {
    show("grammar");

    expect(await screen.findByRole("heading", { level: 1, name: "What's on the grammar test" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "文法形式の判断Grammar form",
      "文の組み立てSentence order",
      "文章の文法Grammar in a passage",
    ]);
    expect(screen.getAllByText("15 questions")).toHaveLength(2);
    expect(screen.getByText("3 passages × 5 questions")).toBeInTheDocument();
    // The chevron on a phone and the link on a computer.
    expect(screen.getAllByRole("link", { name: "Back to the tests" }).map((link) => link.getAttribute("href"))).toEqual(["/", "/"]);
  });

  it("says why a sample's pick is right or wrong, and follows a changed pick", async () => {
    show("grammar");

    await pick("ばかりに");
    expect(screen.getByRole("status")).toHaveTextContent("The answer is 1");
    await pick("にもかかわらず");

    expect(screen.getByRole("status")).toHaveTextContent("Correct");
    expect(screen.getByRole("status")).toHaveTextContent("busy, yet goes to the gym");
  });

  it("shows the kanji 問題 with the levels that have them, 表記 not on N1", async () => {
    show("kanji");

    expect(await screen.findByRole("heading", { level: 1, name: "What's on the kanji test" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["漢字読みKanji reading", "表記Writing in kanji"]);
    expect(screen.getByText("N1 has no writing part. On N5 the word may be written in kanji or katakana.")).toBeInTheDocument();
  });

  it("lists each reading kind's length at the levels that have it", async () => {
    show("reading");

    const long = (await screen.findByRole("heading", { name: /内容理解（長文）/ })).closest("section")!;
    const lengths = within(long).getAllByRole("definition").map((cell) => cell.textContent);
    // N1 to N5: only N1 and N3 have a long passage.
    expect(lengths).toEqual(["~1000 chars", "—", "~550 chars", "—", "—"]);
  });

  it("marks the sentences that prove the answer once the sample is answered, and names each wrong choice's trap", async () => {
    show("reading");
    expect(document.querySelector(".highlighter")).toBeNull();

    await pick("午後一時より前には", 0);

    expect(document.querySelectorAll(".highlighter")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("1 · Trap: one detail changed");
    expect(screen.getByRole("status")).toHaveTextContent("4 · Trap: not in the text");
  });
});
