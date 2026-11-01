import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildReviewChip, buildTestSummary } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import type { TestSummary } from "~/lib/views";
import { TestList } from ".";

const NOT_TAKEN = buildTestSummary({ id: "20261027-aaaaaa", title: "第1週 1日目" });

const LEFT = buildTestSummary({ id: "20261027-cccccc", title: "第2週 1日目", answered: 1 });

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

const headings = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

describe("TestList", () => {
  it("groups the tests: the ones in progress, then the ones not taken yet, then the taken ones", async () => {
    renderList([NOT_TAKEN, LEFT, TAKEN]);

    const inProgress = await screen.findByRole("region", { name: "In progress" });
    expect(within(inProgress).getByRole("link", { name: /第2週 1日目/ })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Not taken yet" })).getByRole("link", { name: /第1週 1日目/ })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Taken" })).getByRole("link", { name: /第3週 1日目/ })).toBeInTheDocument();
    expect(headings()).toEqual(["In progress", "Not taken yet", "Taken"]);
  });

  it("shows the week in a tile, and the days as the title", async () => {
    renderList([{ ...NOT_TAKEN, title: "第2週 1〜6日目", weeks: [2] }]);

    const row = within(await screen.findByRole("listitem"));
    expect(row.getByText("2")).toBeInTheDocument();
    expect(row.getByText("1〜6日目")).toBeInTheDocument();
    expect(row.getByRole("link", { name: /^第2週 1〜6日目/ })).toHaveAttribute("href", `/tests/${NOT_TAKEN.id}`);
  });

  it("shows a test that is not taken, with its size, and a start link, under its group only", async () => {
    renderList([NOT_TAKEN]);

    expect(await screen.findByRole("link", { name: /第1週 1日目/ })).toHaveAttribute("href", `/tests/${NOT_TAKEN.id}`);
    expect(headings()).toEqual(["Not taken yet"]);
    expect(screen.getByText(/3 questions/)).toHaveTextContent(/^3 questions$/);
    expect(screen.getByRole("link", { name: "Start the test" })).toHaveAttribute("href", `/tests/${NOT_TAKEN.id}`);
  });

  it("offers to go on with a test that was left before submitting", async () => {
    renderList([LEFT]);

    expect(await screen.findByRole("link", { name: "Continue" })).toHaveAttribute("href", `/tests/${LEFT.id}`);
    expect(screen.getByText(`In progress 1 / ${LEFT.questionCount}`)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start the test" })).toBeNull();
  });

  it("links a taken test to its results, with the last score", async () => {
    renderList([TAKEN]);

    expect(await screen.findByRole("link", { name: /第3週 1日目/ })).toHaveAttribute("href", `/tests/${TAKEN.id}/results`);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start the test" })).toBeNull();
  });

  it("shows the score of the attempt before", async () => {
    renderList([{ ...TAKEN, previous: { score: 0, total: 3 } }]);

    expect(await screen.findByText(/3 questions/)).toHaveTextContent("3 questions · Last time 0 / 3");
  });

  describe("a taken test", () => {
    it("opens and closes its grammar to review", async () => {
      renderList([TAKEN]);
      const review = await screen.findByRole("button", { name: /Review \(1\)/ });

      await userEvent.click(review);

      expect(review).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /〜ばかりか/ })).toBeInTheDocument();

      await userEvent.click(review);

      expect(screen.queryByRole("button", { name: /〜ばかりか/ })).toBeNull();
    });

    it("posts to the retake route to take the test again", async () => {
      const requests = renderList([TAKEN]);

      await userEvent.click(await screen.findByRole("button", { name: "Take it again" }));

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: `/tests/${TAKEN.id}/retake`, body: null }]));
    });

    it("has no review button when there is nothing to review", async () => {
      renderList([buildTestSummary({ result: { score: 3, total: 3, percent: 100 } })]);
      await screen.findByRole("button", { name: "Take it again" });

      expect(screen.queryByRole("button", { name: /Review/ })).toBeNull();
    });
  });
});
