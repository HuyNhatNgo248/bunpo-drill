import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildNoteView } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { NoteCards } from ".";

const NOTES = [
  buildNoteView({ id: 7, text: "考えた末", sentence: "考えた末、決めた。", memo: "after **thinking** hard" }),
  buildNoteView({ id: 8, text: "工場", sentence: "工場で働く。", memo: "factory" }),
];

/** The deck, with the route action a learned mark would reach. */
function renderDeck() {
  const { action, requests } = recordingAction();
  renderRoute(<NoteCards notes={NOTES} />, { url: "/notes/cards", action });
  return requests;
}

describe("NoteCards", () => {
  it("shows the words on the front and the memo on the back", async () => {
    renderDeck();

    expect(await screen.findByRole("button", { name: /考えた末/ })).not.toHaveTextContent("thinking");

    await userEvent.click(screen.getByRole("button", { name: "Show answer" }));

    const answer = screen.getByRole("region", { name: "Answer" });
    expect(within(answer).getByText("thinking", { selector: "strong" })).toBeInTheDocument();
  });

  it("ends with the counts and studies the missed note again, sending nothing", async () => {
    const requests = renderDeck();

    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }));
    await userEvent.click(screen.getByRole("button", { name: "Again" }));
    for (let i = 0; i < 2; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Show answer" }));
      await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    }

    expect(screen.getByText(/1 got it first time · 1 needed again/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Study it again" }));
    expect(screen.getByRole("button", { name: /考えた末/ })).toBeInTheDocument();
    expect(requests).toEqual([]);
  });
});
