import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildChapterSummary } from "#mocks/factories/views";
import { renderRoute } from "#tests/helpers/render";
import type { KanjiHomeView } from "~/lib/views";
import { KanjiHome } from ".";

/** 生活 ① with every word learned and its quiz taken, and 町 with a word left and no quiz yet. */
const HOME: KanjiHomeView = {
  level: "N2",
  chapters: [
    buildChapterSummary({
      words: 50,
      learned: 50,
      lessons: [{ title: "ギフト", page: 20, words: 50, learned: 50 }],
      quiz: { id: "20261031-aaaaaa", result: { score: 8, total: 10 } },
    }),
    buildChapterSummary({ chapter: 2, title: "町", quiz: null }),
  ],
};

const chapterShown = () => screen.getByRole("heading", { level: 2 }).textContent;

const rowOf = (title: string) => within(screen.getByText(title).closest("li")!);

describe("KanjiHome", () => {
  it("lists the topics in order with their learned words, and shows the first with a word left to learn", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji?level=N2" });

    expect(await screen.findByRole("heading", { level: 1, name: "Kanji" })).toBeInTheDocument();
    const chapters = within(screen.getByRole("navigation", { name: "Topics" })).getAllByRole("link");
    expect(chapters.map((chapter) => chapter.textContent)).toEqual(["1生活 ①50 / 50", "2町24 / 96"]);
    expect(chapters[1]).toHaveAttribute("aria-current", "true");
    expect(chapterShown()).toBe("町");
    expect(screen.getByText("24 / 96 learned · no quiz yet")).toBeInTheDocument();
  });

  it("shows the topic picked, kept in the address", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji?level=N2&chapter=2" });

    const chapter1 = await screen.findByRole("link", { name: /生活 ①/ });
    expect(chapter1).toHaveAttribute("href", "/kanji?level=N2&chapter=1");
    await userEvent.click(chapter1);

    expect(chapterShown()).toBe("生活 ①");
  });

  it("splits the topic into its lessons in the book's order, each opening its own flashcards", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji?level=N2&chapter=2" });

    const lessons = within(await screen.findByRole("region", { name: "Lessons 2" })).getAllByRole("link");
    expect(lessons.map((lesson) => lesson.textContent)).toEqual(["ギフト", "料理"]);
    expect(lessons[1]).toHaveAttribute("href", "/kanji/N2/2/cards?page=21");
    expect(rowOf("ギフト").getByText("50 words · 24 learned")).toBeInTheDocument();
  });

  it("gives the topic's quiz its score, and links to its results", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji?level=N2&chapter=1" });

    const quiz = await screen.findByRole("link", { name: "Quiz" });
    expect(quiz).toHaveAttribute("href", "/tests/20261031-aaaaaa/results");
    expect(quiz.parentElement).toHaveTextContent("8 / 10");
  });

  it("links a quiz not taken yet to the quiz", async () => {
    const home = { ...HOME, chapters: [buildChapterSummary()] };
    renderRoute(<KanjiHome home={home} />, { url: "/kanji?level=N2" });

    expect(await screen.findByRole("link", { name: "Quiz" })).toHaveAttribute("href", "/tests/20261031-aaaaaa");
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("says the book's level has no chapters yet, and how to send one", async () => {
    renderRoute(<KanjiHome home={{ ...HOME, chapters: [] }} />, { url: "/kanji?level=N2" });

    expect(await screen.findByRole("heading", { name: "No N2 chapters yet" })).toBeInTheDocument();
  });

  it("says any level without chapters has none yet, and how to send one", async () => {
    for (const level of ["N5", "N1"] as const) {
      const { unmount } = renderRoute(<KanjiHome home={{ ...HOME, level, chapters: [] }} />, { url: `/kanji?level=${level}` });

      expect(await screen.findByRole("heading", { name: `No ${level} chapters yet` })).toBeInTheDocument();
      expect(screen.getByText(`A chapter shows up here once Claude sends its words, with /jlpt-kanji-quiz ${level} 1章.`)).toBeInTheDocument();
      unmount();
    }
  });
});
