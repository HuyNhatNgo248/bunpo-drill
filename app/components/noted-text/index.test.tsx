import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildNoteView } from "#mocks/factories/views";
import { renderRoute } from "#tests/helpers/render";
import type { NoteView } from "~/lib/views";
import { NotedText, NotesProvider } from ".";

const SENTENCE = "社長は何か月も考えた末、海外の工場を閉めることに決めた。";
const NOTE = buildNoteView({ id: 7, text: "考えた末", memo: "after *thinking* hard" });

/** The sentence under the notes given, or under no provider at all. */
function renderSentence(notes?: NoteView[]) {
  const text = <NotedText text={SENTENCE} />;
  renderRoute(<p>{notes ? <NotesProvider notes={notes}>{text}</NotesProvider> : text}</p>);
}

describe("NotedText", () => {
  it("highlights the words of a note, which show its memo (from Markdown) and the way to it on the notes page", async () => {
    renderSentence([NOTE, buildNoteView({ id: 8, text: "工場", memo: "" })]);

    await userEvent.click(await screen.findByRole("button", { name: "考えた末" }));

    const note = within(screen.getByRole("dialog"));
    expect(note.getByText("thinking", { selector: "em" })).toBeInTheDocument();
    expect(note.getByRole("link", { name: "Open in notes" })).toHaveAttribute("href", "/notes#note-7");
    expect(screen.getByRole("button", { name: "工場" })).toBeInTheDocument();
  });

  it("says a note has no memo yet", async () => {
    renderSentence([buildNoteView({ text: "工場", memo: "" })]);

    await userEvent.click(await screen.findByRole("button", { name: "工場" }));

    expect(within(screen.getByRole("dialog")).getByText("No memo yet.")).toBeInTheDocument();
  });

  it("highlights the longest note where two overlap", async () => {
    renderSentence([buildNoteView({ id: 1, text: "末" }), buildNoteView({ id: 2, text: "考えた末" })]);

    expect(await screen.findByRole("button", { name: "考えた末" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "末" })).toBeNull();
  });

  it("is the text alone without notes", async () => {
    renderSentence();

    expect(await screen.findByText(SENTENCE)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
