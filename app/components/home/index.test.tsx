import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import type { JlptLevel } from "~/lib/payload";
import type { TestSummary } from "~/lib/views";
import { Home } from ".";
import type { HomeStats } from "./Stats";

const TAKEN = buildTestSummary({
  id: "20261027-aaaaaa",
  title: "第1週 1日目",
  result: { score: 2, total: 3, percent: 67 },
});

const NOT_TAKEN = buildTestSummary({ id: "20261027-bbbbbb", title: "第2週 1日目" });

const STATS: HomeStats = { average: 67, toReview: 1, taken: 1 };

/** The home page, with the API routes that its fetchers reach. */
function renderHome(
  tests: TestSummary[],
  {
    stats = STATS,
    level = tests.length ? "N2" : null,
  }: { stats?: HomeStats; level?: JlptLevel | null } = {},
) {
  const { action } = recordingAction();
  renderRoute(<Home tests={tests} stats={stats} level={level} />, {
    routes: [
      { path: "/api/tests", action },
      { path: "/api/tests/:id", action },
    ],
  });
}

describe("Home", () => {
  it("shows the figures over the tests of the level, then the list", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    expect(await screen.findByRole("heading", { name: "Mock tests" })).toBeInTheDocument();
    expect(screen.getByText("Average score").nextSibling).toHaveTextContent("67%");
    expect(screen.getByText("Grammar to review").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Taken").nextSibling).toHaveTextContent("1 / 2");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows a dash for the average before any test is taken", async () => {
    renderHome([NOT_TAKEN], { stats: { average: null, toReview: 0, taken: 0 } });

    expect((await screen.findByText("Average score")).nextSibling).toHaveTextContent("—");
  });

  it("explains where tests come from when there are none", async () => {
    renderHome([]);

    expect(await screen.findByRole("heading", { name: "No mock tests yet" })).toBeInTheDocument();
  });

  it("links to every JLPT level, easiest first, and marks the one shown", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    const nav = await screen.findByRole("navigation", { name: "Level" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(within(nav).getByRole("link", { name: "N5" })).toHaveAttribute("href", "/?level=N5");
    expect(within(nav).getByRole("link", { name: "N2" })).toHaveAttribute("aria-current", "page");
  });

  it("has no level links before any test is saved", async () => {
    renderHome([]);

    await screen.findByRole("heading", { name: "Mock tests" });
    expect(screen.queryByRole("navigation", { name: "Level" })).toBeNull();
  });

  it("says a level the app makes no tests for yet is not available, under its empty trays", async () => {
    renderHome([], { level: "N1" });

    expect(await screen.findByRole("heading", { name: "N1 isn't available yet" })).toBeInTheDocument();
    expect(screen.getByText("Mock tests for N1 are coming later.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Level" })).toBeInTheDocument();
  });

  it("keeps the usual empty state for a level that can have tests but has none", async () => {
    renderHome([], { level: "N3" });

    expect(await screen.findByRole("heading", { name: "No mock tests yet" })).toBeInTheDocument();
  });
});
