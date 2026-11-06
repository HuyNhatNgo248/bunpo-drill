import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import type { JlptLevel } from "~/lib/payload";
import type { TestSummary } from "~/lib/views";
import { Home } from ".";

const TAKEN = buildTestSummary({
  id: "20261027-aaaaaa",
  title: "第1週 1日目",
  result: { score: 2, total: 3, percent: 67 },
});

const NOT_TAKEN = buildTestSummary({ id: "20261027-bbbbbb", title: "第2週 1日目" });

/** The home page at `url`, with the API routes that its fetchers reach. */
function renderHome(
  tests: TestSummary[],
  {
    level = tests.length ? "N2" : null,
    url = "/",
    isAdmin = false,
  }: { level?: JlptLevel | null; url?: string; isAdmin?: boolean } = {},
) {
  const { action, requests } = recordingAction();
  renderRoute(<Home tests={tests} level={level} isAdmin={isAdmin} />, {
    url,
    routes: [{ path: "/api/tests/:id", action }],
  });
  return requests;
}

describe("Home", () => {

  it("lists the tests of the level under a heading for screen readers", async () => {
    renderHome([TAKEN, NOT_TAKEN]);

    expect(await screen.findByRole("heading", { name: "Mock tests" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("explains where tests come from when there are none", async () => {
    renderHome([]);

    expect(await screen.findByRole("heading", { name: "No mock tests yet" })).toBeInTheDocument();
  });

  it("says a level has no tests yet, N1 included", async () => {
    renderHome([], { level: "N1" });

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
