import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute, type StubRoute } from "#tests/helpers/render";
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
function renderHome(tests: TestSummary[], { stats = STATS, api }: { stats?: HomeStats; api?: StubRoute["action"] } = {}) {
  const { action, requests } = recordingAction();
  renderRoute(<Home tests={tests} stats={stats} />, {
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
  it("shows the figures over all tests, then the list", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    expect(await screen.findByRole("heading", { name: "模擬試験" })).toBeInTheDocument();
    expect(screen.getByText("平均正答率").nextSibling).toHaveTextContent("67%");
    expect(screen.getByText("要復習の文法").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("受験済み").nextSibling).toHaveTextContent("1 / 2");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows a dash for the average before any test is taken", async () => {
    renderHome([NOT_TAKEN], { stats: { average: null, toReview: 0, taken: 0 } });

    expect((await screen.findByText("平均正答率")).nextSibling).toHaveTextContent("—");
  });

  it("explains where tests come from when there are none, with no clear-all button", async () => {
    renderHome([]);

    expect(await screen.findByRole("heading", { name: "模擬試験はまだありません" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /すべて削除/ })).toBeNull();
  });

  describe("clearing every test", () => {
    it("asks first, then deletes every test", async () => {
      const requests = renderHome([TAKEN, NOT_TAKEN]);

      await confirm(await screen.findByRole("button", { name: /模擬試験をすべて削除/ }), "すべて削除");

      await waitFor(() => expect(requests).toEqual([{ method: "DELETE", path: "/api/tests", body: null }]));
    });

    it("empties the list while the delete saves", async () => {
      renderHome([TAKEN, NOT_TAKEN], { api: () => new Promise(() => {}) });

      await confirm(await screen.findByRole("button", { name: /模擬試験をすべて削除/ }), "すべて削除");

      expect(await screen.findByRole("heading", { name: "模擬試験はまだありません" })).toBeInTheDocument();
    });
  });

  describe("deleting one test", () => {
    it("asks first, deletes the test, and hides it while the delete saves", async () => {
      renderHome([TAKEN, NOT_TAKEN], { api: () => new Promise(() => {}) });

      // A row has two delete buttons, one for mobile and one for desktop.
      const [deleteButton] = await screen.findAllByRole("button", { name: "「第1週 1日目」を削除" });
      await confirm(deleteButton, "削除");

      await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
      expect(screen.queryByText("第1週 1日目")).toBeNull();
    });

    it("sends the delete to the test", async () => {
      const requests = renderHome([TAKEN]);

      const [deleteButton] = await screen.findAllByRole("button", { name: "「第1週 1日目」を削除" });
      await confirm(deleteButton, "削除");

      await waitFor(() => expect(requests).toEqual([{ method: "DELETE", path: `/api/tests/${TAKEN.id}`, body: null }]));
    });
  });
});
