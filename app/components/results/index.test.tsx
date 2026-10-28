import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildPayload } from "#mocks/factories/payload";
import { buildResultsView, buildReviewChip } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { gradeTest } from "~/lib/grading.server";
import type { ResultsView } from "~/lib/views";
import { Results } from ".";

/** q1 wrong (1 かいもなく), q2 right, q3 left blank. */
const SECTIONS = gradeTest(buildPayload(), { q1: 0, q2: [1, 0, 2, 3] }).sections;

const FAILED = buildResultsView({ score: 1, total: 3, percent: 33, sections: SECTIONS, review: [buildReviewChip({ pattern: "〜かいがある" })] });

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
    expect(screen.getByText("不正解 2問 · 合格ライン 80%")).toBeInTheDocument();
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

    expect(await screen.findByText("復習する文法はありません。全問正解でした。")).toBeInTheDocument();
  });

  describe("the answer review", () => {
    it("shows the score of each section", async () => {
      renderResults(FAILED);

      const section = await screen.findByRole("region", { name: "問題1" });
      expect(section).toHaveTextContent("0 / 1");
    });

    it("strikes out a wrong answer, and gives the right one", async () => {
      renderResults(FAILED);
      await screen.findByRole("region", { name: "問題1" });

      const card = within(reviewOf(1));
      expect(card.getByText("あなたの解答：1 かいもなく").tagName).toBe("S");
      expect(card.getByText("正解：3 かいがあって")).toBeInTheDocument();
    });

    it("says 未回答 for a question left blank", async () => {
      renderResults(FAILED);
      await screen.findByRole("region", { name: "問題3" });

      expect(within(reviewOf(3)).getByText("未回答")).toBeInTheDocument();
    });

    it("shows only the right answer for a question answered right, with the ★ piece marked", async () => {
      renderResults(FAILED);
      await screen.findByRole("region", { name: "問題2" });

      const card = within(reviewOf(2));
      expect(card.queryByText(/あなたの解答/)).toBeNull();
      expect(card.getByText("★ かいが")).toBeInTheDocument();
    });

    it("fills each blank of the passage", async () => {
      renderResults(FAILED);

      expect(await screen.findByText("（3）かいがあって")).toBeInTheDocument();
    });
  });

  describe("the way on", () => {
    it("links back to the list, from the header and from the bottom", async () => {
      renderResults(FAILED);

      const links = await screen.findAllByRole("link", { name: /テスト一覧に戻る/ });
      expect(links).toHaveLength(2);
      for (const link of links) expect(link).toHaveAttribute("href", "/");
    });

    it("posts to the retake route to take the test again", async () => {
      const requests = renderResults(FAILED);

      await userEvent.click(await screen.findByRole("button", { name: "もう一度受ける" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: `/tests/${FAILED.id}/retake`, body: null }]));
    });
  });
});
