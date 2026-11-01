import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildChapterSummary } from "#mocks/factories/views";
import { renderRoute } from "#tests/helpers/render";
import type { KanjiHomeView } from "~/lib/views";
import { KanjiHome } from ".";

/** 1章 with its quiz taken, and 2章 with no quiz yet. */
const HOME: KanjiHomeView = {
  level: "N2",
  chapters: [
    buildChapterSummary({ quiz: { id: "20261031-aaaaaa", result: { score: 8, total: 10 } } }),
    buildChapterSummary({ chapter: 2, title: "町", words: 88, learned: 0, quiz: null }),
  ],
  stats: { learned: 24, words: 184, average: 80, missed: 3 },
};

const rowOf = (title: string) => screen.getByText(title).closest("li")!;

describe("KanjiHome", () => {
  it("shows the figures over the level's chapters, then each chapter", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji" });

    expect(await screen.findByRole("heading", { name: "Kanji" })).toBeInTheDocument();
    expect(screen.getByText("Words learned").nextSibling).toHaveTextContent("24 / 184");
    expect(screen.getByText("Quiz average").nextSibling).toHaveTextContent("80%");
    expect(screen.getByText("Missed words").nextSibling).toHaveTextContent("3");
    expect(within(screen.getByRole("list", { name: "Chapters" })).getAllByRole("listitem")).toHaveLength(2);
  });

  it("gives a chapter its learned words, its quiz score, and links to its flashcards and its results", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji" });
    await screen.findByText("生活-1");
    const row = within(rowOf("生活-1"));

    expect(row.getByText("Chapter 1")).toBeInTheDocument();
    expect(row.getByText("8 / 10")).toBeInTheDocument();
    expect(row.getByText("96 words · 24 learned")).toBeInTheDocument();
    expect(row.getByRole("link", { name: "Flashcards" })).toHaveAttribute("href", "/kanji/N2/1/cards");
    expect(row.getByRole("link", { name: "Quiz" })).toHaveAttribute("href", "/tests/20261031-aaaaaa/results");
  });

  it("opens a chapter's flashcards from anywhere on its row", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji" });
    await screen.findByText("生活-1");
    const row = within(rowOf("生活-1"));

    expect(row.getByRole("link", { name: /生活-1/ })).toHaveAttribute("href", "/kanji/N2/1/cards");
  });

  it("says a chapter has no quiz yet, and offers only its flashcards", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji" });
    await screen.findByText("町");
    const row = within(rowOf("町"));

    expect(row.getByText("88 words · 0 learned · no quiz yet")).toBeInTheDocument();
    expect(row.queryByRole("link", { name: "Quiz" })).toBeNull();
  });

  it("says the book's level has no chapters yet, and how to send one", async () => {
    renderRoute(<KanjiHome home={{ ...HOME, chapters: [] }} />, { url: "/kanji?level=N2" });

    expect(await screen.findByRole("heading", { name: "No N2 chapters yet" })).toBeInTheDocument();
  });

  it("says any other level without chapters is not available yet, under its empty trays, N3 included", async () => {
    for (const level of ["N5", "N3"] as const) {
      const { unmount } = renderRoute(<KanjiHome home={{ ...HOME, level, chapters: [] }} />, { url: `/kanji?level=${level}` });

      expect(await screen.findByRole("heading", { name: `${level} isn't available yet` })).toBeInTheDocument();
      expect(screen.getByText(`Kanji for ${level} is coming later.`)).toBeInTheDocument();
      unmount();
    }
  });

  it("switches to the grammar mock tests at the same level, and between the levels", async () => {
    renderRoute(<KanjiHome home={HOME} />, { url: "/kanji" });

    const subjects = await screen.findByRole("navigation", { name: "Subject" });
    expect(within(subjects).getByRole("link", { name: /Grammar/ })).toHaveAttribute("href", "/?level=N2");
    expect(within(subjects).getByRole("link", { name: /Kanji/ })).toHaveAttribute("aria-current", "page");
    expect(within(screen.getByRole("navigation", { name: "Level" })).getByRole("link", { name: "N2" })).toHaveAttribute("aria-current", "page");
  });
});
