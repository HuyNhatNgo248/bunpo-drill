import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute, type StubRoute } from "#tests/helpers/render";
import type { Level } from "~/lib/payload";
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
  { stats = STATS, levels = ["N2"], api }: { stats?: HomeStats; levels?: Level[]; api?: StubRoute["action"] } = {},
) {
  const { action, requests } = recordingAction();
  renderRoute(<Home tests={tests} stats={stats} level={tests.length ? "N2" : null} levels={levels} />, {
    routes: [
      { path: "/api/tests", action: api ?? action },
      { path: "/api/tests/:id", action: api ?? action },
    ],
  });
  return requests;
}

/** Opens the confirm dialog behind `button`, and confirms with `confirmLabel`. */
async function confirm(button: HTMLElement, confirmLabel: string) {
  await userEvent.click(button);
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: confirmLabel }));
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

  it("links to each level when both have tests, and marks the one shown", async () => {
    renderHome([TAKEN, NOT_TAKEN], { levels: ["N3", "N2"] });

    const nav = await screen.findByRole("navigation", { name: "Level" });
    expect(within(nav).getByRole("link", { name: "N3" })).toHaveAttribute("href", "/?level=N3");
    expect(within(nav).getByRole("link", { name: "N2" })).toHaveAttribute("aria-current", "page");
  });

  it("has no level links when every test is one level", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    await screen.findByRole("heading", { name: "Mock tests" });
    expect(screen.queryByRole("navigation", { name: "Level" })).toBeNull();
  });

  describe("deleting one test", () => {
    it("asks first, deletes the test, and hides it while the delete saves", async () => {
      renderHome([TAKEN, NOT_TAKEN], { api: () => new Promise(() => {}) });

      // A row has two delete buttons, one for mobile and one for desktop.
      const [deleteButton] = await screen.findAllByRole("button", { name: "Delete “第1週 1日目”" });
      await confirm(deleteButton, "Delete");

      await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
      expect(screen.queryByText("第1週 1日目")).toBeNull();
    });

    it("sends the delete to the test", async () => {
      const requests = renderHome([TAKEN]);

      const [deleteButton] = await screen.findAllByRole("button", { name: "Delete “第1週 1日目”" });
      await confirm(deleteButton, "Delete");

      await waitFor(() => expect(requests).toEqual([{ method: "DELETE", path: `/api/tests/${TAKEN.id}`, body: null }]));
    });
  });
});
