import { screen, waitFor, within } from "@testing-library/react";
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

const NOT_TAKEN = buildTestSummary({ id: "20261027-bbbbbb", title: "第2週 1日目" });

const STATS: HomeStats = { average: 67, toReview: 1, taken: 1, total: 2 };

/** The home page at `url`, with the API routes that its fetchers reach. */
function renderHome(
  tests: TestSummary[],
  {
    stats = STATS,
    level = tests.length ? "N2" : null,
    url = "/",
    isAdmin = false,
  }: { stats?: HomeStats; level?: JlptLevel | null; url?: string; isAdmin?: boolean } = {},
) {
  const { action, requests } = recordingAction();
  renderRoute(<Home tests={tests} stats={stats} level={level} isAdmin={isAdmin} />, {
    url,
    routes: [{ path: "/api/tests/:id", action }],
  });
  return requests;
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

  it("says a level the app makes no tests for yet is not available", async () => {
    renderHome([], { level: "N1" });

    expect(await screen.findByRole("heading", { name: "N1 isn't available yet" })).toBeInTheDocument();
    expect(screen.getByText("Mock tests for N1 are coming later.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Level" })).toBeInTheDocument();
  });

  it("keeps the usual empty state for a level that can have tests but has none", async () => {
    renderHome([], { level: "N3" });

    expect(await screen.findByRole("heading", { name: "No mock tests yet" })).toBeInTheDocument();
  });

  describe("renaming or deleting a test", () => {
    it("opens no menu for a user who is not the admin", async () => {
      renderHome([NOT_TAKEN]);

      await userEvent.pointer({ keys: "[MouseRight]", target: await screen.findByRole("link", { name: /第2週 1日目/ }) });

      expect(screen.queryByRole("menuitem", { name: "Delete" })).toBeNull();
    });

    it("lets the admin rename a test from its right-click menu", async () => {
      const requests = renderHome([NOT_TAKEN], { isAdmin: true });

      await userEvent.pointer({ keys: "[MouseRight]", target: await screen.findByRole("link", { name: /第2週 1日目/ }) });
      await userEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));
      const name = within(screen.getByRole("dialog", { name: "Rename the test" })).getByRole("textbox", { name: "Test name" });
      expect(name).toHaveValue("第2週 1日目");
      await userEvent.clear(name);
      await userEvent.type(name, "第2週 まとめ");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(requests).toEqual([{ method: "PATCH", path: `/api/tests/${NOT_TAKEN.id}`, body: { title: "第2週 まとめ" } }]));
    });

    it("lets the admin delete a test from its right-click menu, after asking", async () => {
      const requests = renderHome([NOT_TAKEN], { isAdmin: true });

      await userEvent.pointer({ keys: "[MouseRight]", target: await screen.findByRole("link", { name: /第2週 1日目/ }) });
      await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
      expect(requests).toEqual([]);
      await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(requests).toEqual([{ method: "DELETE", path: `/api/tests/${NOT_TAKEN.id}`, body: null }]));
    });
  });
});
