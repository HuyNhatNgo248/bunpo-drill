import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFillBlankQuestion,
  buildFillBlankSection,
  buildPassageSection,
  buildPayload,
  buildSentenceOrderSection,
} from "#mocks/factories/payload";
import { buildResultsView, buildReviewChip } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { gradeTest } from "~/lib/grading.server";
import type { ResultsView } from "~/lib/views";
import { Results } from ".";

/** q1 wrong (1 かいもなく), q2 right, q3 left blank. */
const SECTIONS = gradeTest(buildPayload(), { q1: 0, q2: [1, 0, 2, 3] }).sections;

const FAILED = buildResultsView({ score: 1, total: 3, percent: 33, sections: SECTIONS, review: [buildReviewChip({ pattern: "〜かいがある" })] });

const EXPLAINED = buildResultsView({
  sections: gradeTest(
    buildPayload({
      sections: [
        buildFillBlankSection({ questions: [buildFillBlankQuestion({ explanation: "The effort paid off, so かいがあって." })] }),
        buildSentenceOrderSection(),
        buildPassageSection(),
      ],
    }),
    {},
  ).sections,
});

const PASSED = buildResultsView({ score: 3, total: 3, percent: 100, review: [] });

/** The results page, with the retake route that its button posts to. */
function renderResults(results: ResultsView) {
  const { action, requests } = recordingAction();
  renderRoute(<Results results={results} />, { routes: [{ path: "/tests/:id/retake", action }] });
  return requests;
}

/** The review card of question `num`, found by its number badge. */
const reviewOf = (num: number) => screen.getByText(String(num), { selector: "span" }).closest<HTMLElement>("[data-slot=card]")!;

describe("Results", () => {
  it("forgets the saved answer sheet of the test, so a retake starts clean", async () => {
    localStorage.setItem(`bunpo:answers:${FAILED.id}`, JSON.stringify({ q1: 0 }));

    renderResults(FAILED);

    await waitFor(() => expect(localStorage.getItem(`bunpo:answers:${FAILED.id}`)).toBeNull());
  });

  it("shows the score, its percent, and the wrong answers against the pass line", async () => {
    renderResults(FAILED);

    expect(await screen.findByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("33%")).toHaveClass("text-warning");
    expect(screen.getByText("2 wrong · pass line 80%")).toBeInTheDocument();
  });

  describe("question list", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("marks each question right or wrong, a blank one wrong", async () => {
      renderResults(FAILED);

      const list = await screen.findByRole("navigation", { name: "Question list" });
      expect(within(list).getByRole("button", { name: "Question 1 (wrong)" })).toBeInTheDocument();
      expect(within(list).getByRole("button", { name: "Question 2 (correct)" })).toBeInTheDocument();
      expect(within(list).getByRole("button", { name: "Question 3 (wrong)" })).toBeInTheDocument();
    });

    it("opens on a phone as a sheet from the bottom bar, with the wrong count and the score", async () => {
      renderResults(FAILED);

      const listButton = await screen.findByRole("button", { name: /Question list/ });
      expect(listButton).toHaveTextContent("2 wrong");
      await userEvent.click(listButton);

      const sheet = screen.getByRole("dialog", { name: "Question list" });
      expect(sheet).toHaveTextContent("Correct 1 / 3");
      expect(within(sheet).getByRole("button", { name: "Question 2 (correct)" })).toBeInTheDocument();
    });

    it("says all are correct when none is wrong", async () => {
      renderResults(PASSED);

      expect(await screen.findByRole("button", { name: /Question list/ })).toHaveTextContent("All correct");
    });

    it("jumps to the answer of the question picked", async () => {
      const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(() => {});
      renderResults(FAILED);

      await userEvent.click(await screen.findByRole("button", { name: "Question 2 (correct)" }));

      expect(document.activeElement).toBe(reviewOf(2));
      expect(scroll).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the score of the attempt before, when there was one", async () => {
    renderResults({ ...FAILED, previous: { score: 0, total: 3 } });

    expect(await screen.findByText("Last time 0 / 3")).toBeInTheDocument();
  });

  it("shows no earlier score on a first attempt", async () => {
    renderResults(FAILED);

    await screen.findByText("1 / 3");
    expect(screen.queryByText(/Last time/)).toBeNull();
  });

  it("shows the percent in green from the pass line up", async () => {
    renderResults(PASSED);

    expect(await screen.findByText("100%")).toHaveClass("text-success");
  });

  it("lists the grammar of the wrong answers to review", async () => {
    renderResults(FAILED);

    expect(await screen.findByRole("button", { name: /〜かいがある/ })).toBeInTheDocument();
  });

  it("says there is nothing to review after a full score", async () => {
    renderResults(PASSED);

    expect(await screen.findByText("Nothing to review. You got every question right.")).toBeInTheDocument();
  });

  describe("the answer review", () => {
    it("shows the score of each section", async () => {
      renderResults(FAILED);

      const section = await screen.findByRole("region", { name: "Part 1" });
      expect(section).toHaveTextContent("0 / 1");
    });

    it("strikes out a wrong answer, and gives the right one", async () => {
      renderResults(FAILED);
      await screen.findByRole("region", { name: "Part 1" });

      const card = within(reviewOf(1));
      expect(card.getByText("Your answer: 1 かいもなく").tagName).toBe("S");
      expect(card.getByText("Answer: 3 かいがあって")).toBeInTheDocument();
    });

    it("says 未回答 for a question left blank", async () => {
      renderResults(FAILED);
      await screen.findByRole("region", { name: "Part 3" });

      expect(within(reviewOf(3)).getByText("Unanswered")).toBeInTheDocument();
    });

    it("shows only the right answer for a question answered right, with the ★ piece marked", async () => {
      renderResults(FAILED);
      await screen.findByRole("region", { name: "Part 2" });

      const card = within(reviewOf(2));
      expect(card.queryByText(/Your answer/)).toBeNull();
      expect(card.getByText("★ かいが")).toBeInTheDocument();
    });

    it("fills each blank of the passage", async () => {
      renderResults(FAILED);

      expect(await screen.findByText("（3）かいがあって")).toBeInTheDocument();
    });

    it("explains the answer under it, for a question that has an explanation", async () => {
      renderResults(EXPLAINED);
      await screen.findByRole("region", { name: "Part 1" });

      expect(within(reviewOf(1)).getByText("The effort paid off, so かいがあって.")).toBeInTheDocument();
      expect(within(reviewOf(2)).queryByText(/かいがあって\./)).toBeNull();
    });
  });

  describe("the way on", () => {
    it("links back to the list, from the header and from the bottom", async () => {
      renderResults(FAILED);

      const links = await screen.findAllByRole("link", { name: /Back to the mock tests/ });
      expect(links).toHaveLength(2);
      for (const link of links) expect(link).toHaveAttribute("href", "/");
    });

    it("posts to the retake route to take the test again", async () => {
      const requests = renderResults(FAILED);

      await userEvent.click(await screen.findByRole("button", { name: "Take it again" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: `/tests/${FAILED.id}/retake`, body: null }]));
    });
  });
});
