import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import type { ReadingGroup, ReadingHomeView } from "~/lib/views";
import { ReadingHome } from ".";

const EMPTY = ([[2, "reading-mid"], [4, "reading-integrated"], [5, "reading-claim"], [6, "reading-info"], [7, "mixed"]] as const).map(
  ([value, type]): ReadingGroup => ({ value, type, sets: [], missed: [], pace: null }),
);

/** 短文 with one set taken (slow, a 指示語 missed), one started and one not; the other groups empty. */
const HOME: ReadingHomeView = {
  level: "N2",
  groups: [
    {
      value: 1,
      type: "reading-short",
      sets: [
        { id: "20261106-aaaaaa", title: "短文 1", questionCount: 2, targetSeconds: 240, answered: null, result: { score: 1, total: 2 }, seconds: 703 },
        { id: "20261106-bbbbbb", title: "短文 2", questionCount: 2, targetSeconds: 240, answered: 1, result: null, seconds: null },
        { id: "20261106-cccccc", title: "短文 3", questionCount: 2, targetSeconds: 240, answered: null, result: null, seconds: null },
      ],
      missed: [{ kind: "指示語", count: 1 }],
      pace: { seconds: 352, target: 120 },
    },
    ...EMPTY,
  ],
};

const rowOf = (title: string) => within(screen.getByText(title).closest("li")!);

describe("ReadingHome", () => {
  it("lists the reading types with their sets taken, and shows the first with a set to do", async () => {
    renderRoute(<ReadingHome home={HOME} />, { url: "/reading?level=N2" });

    const groups = within(await screen.findByRole("navigation", { name: "Reading types" })).getAllByRole("link");
    expect(groups.map((group) => group.textContent)).toEqual(["1短文1 / 3", "2中文0 / 0", "4統合理解0 / 0", "5主張理解0 / 0", "6情報検索0 / 0", "7総合0 / 0"]);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("短文");
    expect(screen.getByText(/1 \/ 3 done/)).toHaveTextContent("1 / 3 done · 5:52 a passage, target 2:00");
  });

  it("shows the kinds missed, then the sets to do and the sets done, each opening its quiz or results", async () => {
    renderRoute(<ReadingHome home={HOME} />, { url: "/reading?level=N2&group=1" });

    expect(within(await screen.findByRole("region", { name: "Question kinds to work on 1" })).getByText("1 missed")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "To do 2" })).getAllByRole("link").map((link) => link.textContent)).toEqual(["短文 2", "短文 3"]);
    expect(rowOf("短文 2").getByText("1 / 2 answered")).toBeInTheDocument();
    expect(rowOf("短文 3").getByText("Start")).toBeInTheDocument();
    expect(rowOf("短文 1").getByText(/^2 questions/)).toHaveTextContent("2 questions · 11:43, target 4:00");
    expect(screen.getByRole("link", { name: "短文 1" })).toHaveAttribute("href", "/tests/20261106-aaaaaa/results");
  });

  it("says how to make a set for a group with none, and for a level with none at all", async () => {
    const { unmount } = renderRoute(<ReadingHome home={HOME} />, { url: "/reading?level=N2&group=4" });

    expect(await screen.findByText("No 統合理解 sets yet")).toBeInTheDocument();
    unmount();

    renderRoute(<ReadingHome home={{ level: "N2", groups: [{ ...HOME.groups[0]!, sets: [] }, ...EMPTY] }} />, { url: "/reading" });
    expect(await screen.findByText("No N2 reading sets yet")).toBeInTheDocument();
  });
});

describe("ReadingHome for the admin", () => {
  /** The page as the admin sees it, with the API route its menu's fetchers reach. */
  function renderAsAdmin() {
    const { action, requests } = recordingAction();
    renderRoute(<ReadingHome home={HOME} isAdmin />, { url: "/reading?level=N2&group=1", routes: [{ path: "/api/tests/:id", action }] });
    return requests;
  }

  it("renames a set from its right-click menu", async () => {
    const requests = renderAsAdmin();

    await userEvent.pointer({ keys: "[MouseRight]", target: await screen.findByRole("link", { name: "短文 3" }) });
    await userEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));
    const name = within(screen.getByRole("dialog", { name: "Rename the test" })).getByRole("textbox", { name: "Test name" });
    await userEvent.clear(name);
    await userEvent.type(name, "短文 3 改");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(requests).toEqual([{ method: "PATCH", path: "/api/tests/20261106-cccccc", body: { title: "短文 3 改" } }]));
  });

  it("deletes a set from its right-click menu, after asking", async () => {
    const requests = renderAsAdmin();

    await userEvent.pointer({ keys: "[MouseRight]", target: await screen.findByRole("link", { name: "短文 1" }) });
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(requests).toEqual([{ method: "DELETE", path: "/api/tests/20261106-aaaaaa", body: null }]));
  });

  it("gives no menu to anyone else", async () => {
    renderRoute(<ReadingHome home={HOME} />, { url: "/reading?level=N2&group=1" });

    await userEvent.pointer({ keys: "[MouseRight]", target: await screen.findByRole("link", { name: "短文 3" }) });

    expect(screen.queryByRole("menuitem", { name: "Rename" })).toBeNull();
  });
});
