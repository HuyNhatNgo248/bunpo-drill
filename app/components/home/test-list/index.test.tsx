import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildReviewChip, buildTestSummary } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import type { TestSummary } from "~/lib/views";
import { TestList } from ".";

const NOT_TAKEN = buildTestSummary({ id: "20261027-aaaaaa", title: "第1週 1日目", weeks: [1] });

const LEFT = buildTestSummary({ id: "20261027-cccccc", title: "第1週 2日目", weeks: [1], answered: 1 });

const TAKEN = buildTestSummary({ id: "20261027-bbbbbb", title: "第1週 3日目", weeks: [1], result: { score: 1, total: 3, percent: 33 } });

const renderList = (tests: TestSummary[], url = "/") => renderRoute(<TestList tests={tests} />, { url });

/** Test `number` of the 総合 series, taken (with `score` of 90) or not. */
const ofSeries = (number: number, score?: number) =>
  buildTestSummary({
    id: `20261124-00000${number}`,
    title: `第1〜8週 総合 ${number}`,
    questionCount: 90,
    weeks: [1, 2, 3, 4, 5, 6, 7, 8],
    result: score === undefined ? null : { score, total: 90, percent: Math.round((score / 90) * 100) },
  });

describe("TestList", () => {
  it("lists every test under 総合, with no weeks to pick from", async () => {
    renderList([NOT_TAKEN, TAKEN]);

    expect(await screen.findByRole("heading", { level: 2, name: "総合" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Weeks" })).toBeNull();
    expect(screen.getByRole("link", { name: "第1週 3日目" })).toHaveAttribute("href", `/tests/${TAKEN.id}/results`);
  });

  it("shows how many tests are taken, their average and the best score", async () => {
    renderList([NOT_TAKEN, TAKEN, { ...TAKEN, id: "20261027-dddddd", result: { score: 3, total: 3, percent: 100 } }]);

    await screen.findByRole("heading", { level: 2, name: "総合" });
    expect(screen.getAllByRole("definition").map((figure) => figure.textContent)).toEqual(["2 / 3", "67%", "3 / 3"]);
  });

  it("shows dashes for the average and best before any test is taken", async () => {
    renderList([NOT_TAKEN]);

    await screen.findByRole("heading", { level: 2, name: "総合" });
    expect(screen.getAllByRole("definition").map((figure) => figure.textContent)).toEqual(["0 / 1", "—", "—"]);
  });

  it("puts the test under way up, to continue", async () => {
    renderList([NOT_TAKEN, LEFT, TAKEN]);

    const next = within(await screen.findByRole("region", { name: "In progress" }));
    expect(next.getByRole("link", { name: "第1週 2日目" })).toHaveAttribute("href", `/tests/${LEFT.id}`);
    expect(next.getByText("Continue")).toBeInTheDocument();
  });

  it("else puts up the first test not taken, in the order the page shows them", async () => {
    renderList([NOT_TAKEN, ofSeries(1, 85), ofSeries(2)]);

    const next = within(await screen.findByRole("region", { name: "Next test" }));
    expect(next.getByRole("link", { name: "第1〜8週 総合 2" })).toHaveAttribute("href", "/tests/20261124-000002");
    expect(next.getByText("Start")).toBeInTheDocument();
  });

  it("has no test to take next once every test is taken", async () => {
    renderList([TAKEN]);

    await screen.findByRole("heading", { level: 2, name: "総合" });
    expect(screen.queryByRole("region", { name: /^(Next test|In progress)$/ })).toBeNull();
  });

  it("shows a series as numbered tiles with their scores and how many are taken, and the other tests as rows", async () => {
    renderList([ofSeries(2), ofSeries(1, 85), ofSeries(3, 60), NOT_TAKEN]);

    const board = within(await screen.findByRole("region", { name: "第1〜8週 総合 2 / 3" }));
    const tiles = board.getAllByRole("link");
    expect(tiles.map((tile) => tile.textContent)).toEqual(["185/90", "2", "360/90"]);
    expect(tiles.map((tile) => tile.getAttribute("aria-label"))).toEqual([
      "第1〜8週 総合 1 85 / 90",
      "第1〜8週 総合 2 Not taken",
      "第1〜8週 総合 3 60 / 90",
    ]);
    expect(tiles[0]).toHaveAttribute("href", "/tests/20261124-000001/results");
    expect(within(screen.getByRole("region", { name: "Other tests" })).getByRole("link", { name: "第1週 1日目" })).toBeInTheDocument();
  });

  it("shows the days as a test's title, and links a test not taken to the quiz, with its size", async () => {
    renderList([{ ...NOT_TAKEN, title: "第1週 1〜6日目" }]);

    const row = within(await screen.findByRole("listitem"));
    expect(row.getByText("1〜6日目")).toBeInTheDocument();
    expect(row.getByRole("link", { name: "第1週 1〜6日目" })).toHaveAttribute("href", `/tests/${NOT_TAKEN.id}`);
    expect(row.getByText("3 questions")).toBeInTheDocument();
    expect(row.getByText("Start")).toBeInTheDocument();
  });

  it("says how far a test in progress got, to continue it", async () => {
    renderList([LEFT]);

    const row = within(await screen.findByRole("listitem"));
    expect(row.getByRole("link")).toHaveAttribute("href", `/tests/${LEFT.id}`);
    expect(row.getByText(`1 / ${LEFT.questionCount} answered`)).toBeInTheDocument();
    expect(row.getByText("Continue")).toBeInTheDocument();
  });

  it("links a taken test to its results, with its score", async () => {
    renderList([TAKEN]);

    const row = within(await screen.findByRole("listitem"));
    expect(row.getByRole("link")).toHaveAttribute("href", `/tests/${TAKEN.id}/results`);
    expect(row.getByText("1 / 3")).toBeInTheDocument();
    expect(row.getByText("Results")).toBeInTheDocument();
  });

  describe("the grammar to review", () => {
    const BAKARIKA = buildReviewChip({ grammarId: "n2-w1-d2-g4", pattern: "〜ばかりか", week: 1, day: 2, number: 4 });
    // Before 〜ばかりか in the note, but reviewed, so after it.
    const MONONO = buildReviewChip({ grammarId: "n2-w1-d1-g1", pattern: "〜ものの", week: 1, day: 1, number: 1, reviewed: true });
    const TESTS = [
      { ...TAKEN, review: [BAKARIKA, MONONO] },
      // A test of weeks 1 and 2: its grammar of both weeks is in the one list.
      buildTestSummary({
        id: "20261027-dddddd",
        weeks: [1, 2],
        result: { score: 0, total: 3, percent: 0 },
        review: [BAKARIKA, buildReviewChip({ grammarId: "n2-w2-d1-g1", pattern: "〜かける", week: 2 })],
      }),
    ];

    /** The list with the action that a review mark reaches. */
    function renderWithReview() {
      const { action, requests } = recordingAction();
      renderRoute(<TestList tests={TESTS} />, { routes: [{ path: "/api/tests/:id", action }] });
      return requests;
    }

    const reviewSection = async () => within(await screen.findByRole("region", { name: /Grammar to review/ }));

    it("shows the grammar any test got wrong, once each, in note order with the ones left first, and how many are left", async () => {
      renderWithReview();

      const section = await reviewSection();
      expect(section.getAllByRole("button").map((chip) => chip.textContent)).toEqual(["〜ばかりか", "〜かける", "〜ものの(reviewed)"]);
      expect(screen.getByRole("heading", { name: /Grammar to review/ })).toHaveTextContent("Grammar to review 2 / 3 left");
    });

    it("has no section when nothing was wrong", async () => {
      renderRoute(<TestList tests={[TAKEN]} />);

      await screen.findByRole("heading", { level: 2, name: "総合" });
      expect(screen.queryByRole("region", { name: /Grammar to review/ })).toBeNull();
    });

    it("marks a pattern reviewed in every test that got it wrong", async () => {
      const requests = renderWithReview();
      await userEvent.click((await reviewSection()).getByRole("button", { name: "〜ばかりか" }));

      await userEvent.click(await screen.findByRole("button", { name: "Mark as reviewed" }));

      const body = { grammarId: BAKARIKA.grammarId, reviewed: true };
      await waitFor(() =>
        expect(requests).toEqual([
          { method: "PATCH", path: `/api/tests/${TAKEN.id}`, body },
          { method: "PATCH", path: "/api/tests/20261027-dddddd", body },
        ]),
      );
    });
  });
});
