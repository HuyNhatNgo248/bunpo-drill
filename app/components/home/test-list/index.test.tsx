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

/** One test of `week`, taken or not. */
const ofWeek = (week: number, taken = false) =>
  buildTestSummary({
    id: `20261027-00000${week}`,
    title: `第${week}週 1日目`,
    weeks: [week],
    result: taken ? { score: 3, total: 3, percent: 100 } : null,
  });

const renderList = (tests: TestSummary[], url = "/") => renderRoute(<TestList tests={tests} />, { url });

const weekShown = () => screen.getByRole("heading", { level: 2 }).textContent;

describe("TestList", () => {
  it("lists the weeks with how many of their tests are taken, and shows the first with a test left to take", async () => {
    renderList([ofWeek(1, true), ofWeek(2), ofWeek(3, true)]);

    const weeks = within(await screen.findByRole("navigation", { name: "Weeks" })).getAllByRole("link");
    expect(weeks.map((week) => week.textContent)).toEqual(["Week 11 / 1", "Week 20 / 1", "Week 31 / 1"]);
    expect(weeks[1]).toHaveAttribute("aria-current", "true");
    expect(weekShown()).toBe("Week 2");
  });

  it("shows the week picked, kept in the address", async () => {
    renderList([ofWeek(1), ofWeek(2)], "/?level=N2&week=2");
    expect(await screen.findByRole("heading", { level: 2, name: "Week 2" })).toBeInTheDocument();

    const week1 = screen.getByRole("link", { name: /^Week 1/ });
    expect(week1).toHaveAttribute("href", "/?level=N2&week=1");
    await userEvent.click(week1);

    expect(weekShown()).toBe("Week 1");
  });

  it("splits a week's tests into the ones in progress, not taken and taken", async () => {
    renderList([NOT_TAKEN, LEFT, TAKEN]);

    expect(within(await screen.findByRole("region", { name: "In progress 1" })).getByRole("link")).toHaveAccessibleName(/^第1週 2日目/);
    expect(within(screen.getByRole("region", { name: "Not taken 1" })).getByRole("link")).toHaveAccessibleName(/^第1週 1日目/);
    expect(within(screen.getByRole("region", { name: "Taken 1" })).getByRole("link")).toHaveAccessibleName(/^第1週 3日目/);
  });

  it("puts a test of several weeks under its first", async () => {
    renderList([ofWeek(4), ofWeek(5), buildTestSummary({ id: "20261027-ffffff", title: "第5週・第6週", weeks: [5, 6] })], "/?week=5");

    expect(await screen.findByRole("link", { name: /^第5週・第6週/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^第5週 1日目/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^第4週 1日目/ })).toBeNull();
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
    const MONONO = buildReviewChip({ grammarId: "n2-w1-d5-g1", pattern: "〜ものの", week: 1, day: 5, number: 1, reviewed: true });
    const TESTS = [
      { ...TAKEN, review: [BAKARIKA, MONONO] },
      // A test of weeks 1 and 2, under week 1: its week-2 grammar goes to week 2.
      buildTestSummary({
        id: "20261027-dddddd",
        weeks: [1, 2],
        result: { score: 0, total: 3, percent: 0 },
        review: [BAKARIKA, buildReviewChip({ grammarId: "n2-w2-d1-g1", pattern: "〜かける", week: 2 })],
      }),
      ofWeek(2),
    ];

    /** The list with the action that a review mark reaches. */
    function renderWithReview(url = "/?week=1") {
      const { action, requests } = recordingAction();
      renderRoute(<TestList tests={TESTS} />, { url, routes: [{ path: "/api/tests/:id", action }] });
      return requests;
    }

    const reviewSection = async () => within(await screen.findByRole("region", { name: /Grammar to review/ }));

    it("shows the week's grammar that a test got wrong above its tests, once each, with how many are left", async () => {
      renderWithReview();

      const section = await reviewSection();
      expect(section.getAllByRole("button").map((chip) => chip.textContent)).toEqual(["〜ばかりか", "〜ものの(reviewed)"]);
      expect(screen.getByRole("heading", { name: /Grammar to review/ })).toHaveTextContent("Grammar to review 1");
    });

    it("shows another week's grammar under that week, whichever test got it wrong", async () => {
      renderWithReview("/?week=2");

      expect((await reviewSection()).getAllByRole("button").map((chip) => chip.textContent)).toEqual(["〜かける"]);
    });

    it("has no section for a week with nothing wrong", async () => {
      renderRoute(<TestList tests={[ofWeek(1, true)]} />);

      await screen.findByRole("heading", { level: 2, name: "Week 1" });
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
