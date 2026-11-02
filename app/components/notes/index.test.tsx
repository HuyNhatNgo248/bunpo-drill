import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildNoteView } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import type { NoteView } from "~/lib/views";
import { Notes } from ".";

const NOTE = buildNoteView({ id: 7, text: "考えた末", memo: "after **thinking** hard", testId: "20261027-abc123", testTitle: "第3週 1〜3日目" });

/** The notes page at `url`, with the route action that its fetchers send to. */
function renderNotes(notes: NoteView[] = [NOTE], url = "/notes") {
  const { action, requests } = recordingAction();
  renderRoute(<Notes notes={notes} />, { url, action });
  return requests;
}

describe("Notes", () => {
  it("lists each note with its sentence (the words marked), its memo drawn from Markdown, and the test it came from", async () => {
    renderNotes();

    const card = within((await screen.findByRole("heading", { name: "考えた末" })).closest<HTMLElement>("[data-slot=card]")!);
    expect(card.getByText("考えた末", { selector: "mark" })).toBeInTheDocument();
    expect(card.getByText("thinking", { selector: "strong" })).toBeInTheDocument();
    expect(card.getByRole("link", { name: "From 第3週 1〜3日目" })).toHaveAttribute("href", "/tests/20261027-abc123/results#question-14");
  });

  it("links an older note, kept without its question, to the top of the results", async () => {
    renderNotes([buildNoteView({ anchor: null })]);

    expect(await screen.findByRole("link", { name: /^From/ })).toHaveAttribute("href", "/tests/20261027-abc123/results");
  });

  it("marks the note that a highlighted word links to as the current one", async () => {
    renderNotes([NOTE, buildNoteView({ id: 8, text: "工場" })], "/notes#note-7");

    const card = (await screen.findByRole("heading", { name: "考えた末" })).closest("[data-slot=card]");
    expect(card).toHaveAttribute("id", "note-7");
    expect(card).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("heading", { name: "工場" }).closest("[data-slot=card]")).not.toHaveAttribute("aria-current");
  });

  it("edits a memo in Markdown, saving it when its box is left, if it changed", async () => {
    const requests = renderNotes();

    await userEvent.click(await screen.findByRole("button", { name: "Edit the memo of 考えた末" }));
    expect(screen.getByRole("textbox", { name: "Memo" })).toHaveValue("after **thinking** hard");
    await userEvent.tab();
    await userEvent.click(screen.getByRole("button", { name: "Edit the memo of 考えた末" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "Memo" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Memo" }), "- **かんがえたすえ**{Control>}{Enter}{/Control}");

    await waitFor(() => expect(requests).toEqual([{ method: "PATCH", path: "/notes", body: { id: 7, memo: "- **かんがえたすえ**" } }]));
  });

  it("puts a memo back as it was on Escape, saving nothing", async () => {
    const requests = renderNotes([buildNoteView({ text: "考えた末", memo: "" })]);

    await userEvent.click(await screen.findByRole("button", { name: "Add a memo to 考えた末" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Memo" }), "かんがえたすえ{Escape}");

    expect(screen.getByRole("button", { name: "Add a memo to 考えた末" })).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it("deletes a note", async () => {
    const requests = renderNotes();

    await userEvent.click(await screen.findByRole("button", { name: "Delete 考えた末" }));

    await waitFor(() => expect(requests).toEqual([{ method: "DELETE", path: "/notes", body: { id: 7 } }]));
  });

  it("says how to add notes when there are none", async () => {
    renderNotes([]);

    expect(await screen.findByRole("heading", { name: "No notes yet" })).toBeInTheDocument();
  });
});
