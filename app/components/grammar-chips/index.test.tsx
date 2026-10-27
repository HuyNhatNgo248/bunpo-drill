import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildReviewChip } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { GrammarChips } from ".";

const TEST_ID = "20261027-abc123";

const CHIP = buildReviewChip({ pattern: "〜ばかりか", week: 3, day: 2, number: 4 });

/** The chips, with the action that a review toggle reaches. */
function renderChips(chips = [CHIP]) {
  const { action, requests } = recordingAction();
  renderRoute(<GrammarChips testId={TEST_ID} chips={chips} />, { routes: [{ path: "/api/tests/:id", action }] });
  return requests;
}

const chipButton = () => screen.findByRole("button", { name: /〜ばかりか/ });

describe("GrammarChips", () => {
  it("shows where the grammar point is in the 文法ノート", async () => {
    renderChips();

    await userEvent.click(await chipButton());

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("N2");
    expect(dialog).toHaveTextContent("第3週");
    expect(dialog).toHaveTextContent("2日目");
    expect(dialog).toHaveTextContent("④");
  });

  it("sends the mark to the test", async () => {
    const requests = renderChips();
    await userEvent.click(await chipButton());

    await userEvent.click(screen.getByRole("button", { name: "復習済みにする" }));

    await waitFor(() =>
      expect(requests).toEqual([
        { method: "PATCH", path: `/api/tests/${TEST_ID}`, body: { grammarId: CHIP.grammarId, reviewed: true } },
      ]),
    );
  });

  it("shows the mark while it saves, before the page loads it again", async () => {
    // An action that never answers keeps the fetcher busy, the way a slow network does.
    renderRoute(<GrammarChips testId={TEST_ID} chips={[CHIP]} />, {
      routes: [{ path: "/api/tests/:id", action: () => new Promise(() => {}) }],
    });
    await userEvent.click(await chipButton());

    await userEvent.click(screen.getByRole("button", { name: "復習済みにする" }));

    // The open popover hides the chip from the accessibility tree, so the test reads the popover's button.
    expect(await screen.findByRole("button", { name: /復習済み · 元に戻す/ })).toBeInTheDocument();
  });

  it("clears the mark of a reviewed point", async () => {
    const requests = renderChips([buildReviewChip({ pattern: "〜ばかりか", reviewed: true })]);
    await userEvent.click(await chipButton());

    await userEvent.click(screen.getByRole("button", { name: /元に戻す/ }));

    await waitFor(() => expect(requests[0]?.body).toEqual({ grammarId: CHIP.grammarId, reviewed: false }));
  });
});
