import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { renderRoute } from "#tests/helpers/render";
import { AddNote } from ".";

const TEST_ID = "20261027-abc123";
const SENTENCE = "社長は何か月も考えた末、海外の工場を閉めることに決めた。";

/** A page with a sentence to note from and a line that is not one, and the notes route, which answers `added`. */
function renderPage(added = true) {
  const sent: unknown[] = [];
  const action = async ({ request }: { request: Request }) => {
    sent.push({ method: request.method, body: await request.json() });
    return { added };
  };
  renderRoute(
    <>
      <div id="question-14">
        <p data-note-sentence={SENTENCE}>{SENTENCE}</p>
      </div>
      <p>海外の工場</p>
      <AddNote testId={TEST_ID} />
    </>,
    { routes: [{ path: "/notes", action }] },
  );
  return sent;
}

/** Selects the first `text` on the page, in the element `selector`, as a drag over it would. */
function select(selector: string, text: string) {
  const node = document.querySelector(selector)!.firstChild!;
  const at = node.textContent!.indexOf(text);
  const range = document.createRange();
  range.setStart(node, at);
  range.setEnd(node, at + text.length);
  act(() => {
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
}

beforeAll(() => {
  // jsdom lays nothing out, and has no box for a range.
  Range.prototype.getBoundingClientRect ??= () => new DOMRect();
});

describe("AddNote", () => {
  it("adds the words selected in a sentence to the notes, with the sentence and a memo, and closes", async () => {
    const sent = renderPage();
    await screen.findByText(SENTENCE);

    select("[data-note-sentence]", "考えた末");
    await userEvent.click(await screen.findByRole("button", { name: "Add to notes" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Memo (optional)" }), "after thinking hard");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(sent).toEqual([{ method: "POST", body: { text: "考えた末", sentence: SENTENCE, anchor: "question-14", testId: TEST_ID, memo: "after thinking hard" } }]),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("says when the words are in the notes already", async () => {
    renderPage(false);
    await screen.findByText(SENTENCE);

    select("[data-note-sentence]", "閉める");
    await userEvent.click(await screen.findByRole("button", { name: "Add to notes" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Already in your notes.")).toBeInTheDocument();
  });

  it("offers nothing for a selection outside a sentence", async () => {
    renderPage();
    await screen.findByText(SENTENCE);

    select("p:not([data-note-sentence])", "工場");

    expect(screen.queryByRole("button", { name: "Add to notes" })).toBeNull();
  });
});
