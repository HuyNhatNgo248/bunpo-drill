import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const NOT_TAKEN = buildTestSummary({ id: "20261027-bbbbbb", title: "第2週 1日目", patterns: ["〜あげく", "〜末に"] });

const STATS: HomeStats = { average: 67, toReview: 1, taken: 1, total: 2 };

/** The home page at `url`, with the API routes that its fetchers reach. */
function renderHome(
  tests: TestSummary[],
  {
    stats = STATS,
    level = tests.length ? "N2" : null,
    latestFirst = false,
    url = "/",
  }: { stats?: HomeStats; level?: JlptLevel | null; latestFirst?: boolean; url?: string } = {},
) {
  const { action } = recordingAction();
  renderRoute(<Home tests={tests} stats={stats} level={level} latestFirst={latestFirst} />, {
    url,
    routes: [{ path: "/api/tests/:id", action }],
  });
}

describe("Home", () => {

  it("shows the figures over the tests of the level, then the list", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    expect(await screen.findByRole("heading", { name: "Mock tests" })).toBeInTheDocument();
    expect(screen.getByText("Average score").nextSibling).toHaveTextContent("67%");
    expect(screen.getByText("Grammar to review").nextSibling).toHaveTextContent("1");
    // The figure, not the heading of the taken tests' group.
    expect(screen.getByText("Taken", { selector: "div" }).nextSibling).toHaveTextContent("1 / 2");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("sorts from week 1, and offers the latest week first", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    await userEvent.click(await screen.findByRole("button", { name: "Sort: From week 1" }));

    expect(screen.getByRole("menuitem", { name: "From week 1" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("menuitem", { name: "Latest week first" })).toHaveAttribute("href", "/?level=N2&sort=latest");
  });

  it("says when the latest week comes first, and links back to week 1 first", async () => {
    renderHome([TAKEN, NOT_TAKEN], { latestFirst: true });

    await userEvent.click(await screen.findByRole("button", { name: "Sort: Latest week first" }));

    expect(screen.getByRole("menuitem", { name: "From week 1" })).toHaveAttribute("href", "/?level=N2");
  });

  it("filters the tests by title or grammar as it is typed, naming the grammar a test was found by", async () => {
    renderHome([TAKEN, NOT_TAKEN]);
    const search = await screen.findByRole("searchbox", { name: "Search the tests" });

    await userEvent.type(search, "2週");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("第2週 1日目");

    await userEvent.clear(search);
    await userEvent.type(search, "あげく");
    expect(screen.getByRole("listitem")).toHaveTextContent("「〜あげく」");

    await userEvent.type(search, "{Escape}");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("says when no test matches, and clears the search", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    await userEvent.type(await screen.findByRole("searchbox", { name: "Search the tests" }), "ばかりか");
    expect(screen.getByRole("heading", { name: "No tests match “ばかりか”" })).toBeInTheDocument();

    // The button under the message; the ✕ in the box does the same.
    await userEvent.click(screen.getByText("Clear the search"));
    expect(screen.getByRole("searchbox", { name: "Search the tests" })).toHaveValue("");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("opens with the search in the address, and keeps it in the sort menu's links", async () => {
    renderHome([TAKEN, NOT_TAKEN], { url: `/?level=N2&q=${encodeURIComponent("2週")}` });

    expect(await screen.findByRole("searchbox", { name: "Search the tests" })).toHaveValue("2週");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Sort: From week 1" }));
    expect(screen.getByRole("menuitem", { name: "Latest week first" })).toHaveAttribute("href", `/?level=N2&sort=latest&q=${encodeURIComponent("2週")}`);
  });

  it("shows a dash for the average before any test is taken", async () => {
    renderHome([NOT_TAKEN], { stats: { average: null, toReview: 0, taken: 0, total: 1 } });

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
