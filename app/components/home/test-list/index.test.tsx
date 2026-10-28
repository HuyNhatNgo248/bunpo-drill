import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildReviewChip, buildTestSummary } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import type { TestSummary } from "~/lib/views";
import { TestList } from ".";

const NOT_TAKEN = buildTestSummary({ id: "20261027-aaaaaa", title: "第1週 1日目", weeks: [1, 2] });

const TAKEN = buildTestSummary({
  id: "20261027-bbbbbb",
  title: "第3週 1日目",
  result: { score: 1, total: 3, percent: 33 },
  review: [buildReviewChip({ pattern: "〜ばかりか" })],
});

/** The list, with the retake route that a row posts to. */
function renderList(tests: TestSummary[]) {
  const { action, requests } = recordingAction();
  renderRoute(<TestList tests={tests} />, { routes: [{ path: "/tests/:id/retake", action }] });
  return requests;
}

describe("TestList", () => {
  it("shows a test that is not taken, with its size and weeks, and a start link", async () => {
    renderList([NOT_TAKEN]);

    expect(await screen.findByRole("link", { name: /第1週 1日目/ })).toHaveAttribute("href", `/tests/${NOT_TAKEN.id}`);
    expect(screen.getByText(/3問/)).toHaveTextContent("3問 · 第1週・第2週");
    expect(screen.getByRole("link", { name: "テストを始める" })).toHaveAttribute("href", `/tests/${NOT_TAKEN.id}`);
  });

  it("offers to go on with a test that was left before submitting", async () => {
    localStorage.setItem(`bunpo:answers:${NOT_TAKEN.id}`, JSON.stringify({ q1: 2 }));

    renderList([NOT_TAKEN]);

    expect(await screen.findByRole("link", { name: "続きから" })).toHaveAttribute("href", `/tests/${NOT_TAKEN.id}`);
    expect(screen.getByText(`解答中 1 / ${NOT_TAKEN.questionCount}`)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "テストを始める" })).toBeNull();
  });

  it("links a taken test to its results, with the last score", async () => {
    renderList([TAKEN]);

    expect(await screen.findByRole("link", { name: /第3週 1日目/ })).toHaveAttribute("href", `/tests/${TAKEN.id}/results`);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "テストを始める" })).toBeNull();
  });

  it("gives every row a handle to drag, named after its test", async () => {
    renderList([NOT_TAKEN, TAKEN]);

    expect(await screen.findByRole("button", { name: "「第1週 1日目」を並べ替え" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "「第3週 1日目」を並べ替え" })).toBeInTheDocument();
  });

  describe("a taken test", () => {
    it("opens and closes its grammar to review", async () => {
      renderList([TAKEN]);
      const review = await screen.findByRole("button", { name: /復習（1）/ });

      await userEvent.click(review);

      expect(review).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /〜ばかりか/ })).toBeInTheDocument();

      await userEvent.click(review);

      expect(screen.queryByRole("button", { name: /〜ばかりか/ })).toBeNull();
    });

    it("posts to the retake route to take the test again", async () => {
      const requests = renderList([TAKEN]);

      await userEvent.click(await screen.findByRole("button", { name: "もう一度受ける" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: `/tests/${TAKEN.id}/retake`, body: null }]));
    });

    it("has no review button when there is nothing to review", async () => {
      renderList([buildTestSummary({ result: { score: 3, total: 3, percent: 100 } })]);
      await screen.findByRole("button", { name: "もう一度受ける" });

      expect(screen.queryByRole("button", { name: /復習/ })).toBeNull();
    });
  });
});
