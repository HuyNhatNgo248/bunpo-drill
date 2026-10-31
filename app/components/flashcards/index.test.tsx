import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildFlashCard, buildFlashcardsView } from "#mocks/factories/views";
import { recordingAction } from "#tests/helpers/actions";
import { renderRoute } from "#tests/helpers/render";
import { Flashcards } from ".";

const INVITE_ID = "n2-c1-招く";

/** Two cards of 1章: 招待状, then 招く, with 招待状 as 招く's other word; none learned yet. */
const VIEW = buildFlashcardsView({
  words: 2,
  learned: 0,
  quiz: { id: "20261031-aaaaaa", result: null },
  cards: [
    buildFlashCard({ related: [{ word: "招く", reading: "まねく" }] }),
    buildFlashCard({ wordId: INVITE_ID, word: "招く", reading: "まねく", meaning: "to invite", related: [{ word: "招待状", reading: "しょうたいじょう" }] }),
  ],
});

/** The session page, with the route action its learned marks reach. */
function renderCards() {
  const { action, requests } = recordingAction();
  renderRoute(<Flashcards view={VIEW} />, { url: "/kanji/N2/1/cards", action });
  return requests;
}

/** Shows the answer of the card on the table, then rates it. */
async function rate(rating: "Again" | "Got it") {
  await userEvent.click(await screen.findByRole("button", { name: "Show answer" }));
  await userEvent.click(screen.getByRole("button", { name: rating }));
}

describe("Flashcards", () => {
  it("shows a word on the front, and its reading, meaning and kanji readings on the back", async () => {
    renderCards();

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
    expect(screen.queryByText("しょうたいじょう")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Show answer" }));

    const answer = screen.getByRole("region", { name: "Answer" });
    expect(within(answer).getByText("しょうたいじょう")).toBeInTheDocument();
    expect(within(answer).getByText("invitation card")).toBeInTheDocument();
    expect(within(answer).getByText("まね-く")).toBeInTheDocument();
    expect(within(answer).getByText("8 strokes")).toBeInTheDocument();
    expect(within(answer).getByText("まねく")).toBeInTheDocument();
  });

  it("shows the reading and the meaning on the front in 表記, to write the word", async () => {
    renderCards();

    await userEvent.click(await screen.findByRole("button", { name: "表記" }));

    expect(screen.getByRole("button", { name: /しょうたいじょう/ })).toHaveTextContent("invitation card");
    expect(screen.queryByText("招待状")).toBeNull();
  });

  it("flips the card when it is tapped", async () => {
    renderCards();

    await userEvent.click(await screen.findByRole("button", { name: /招待状/ }));

    expect(screen.getByRole("region", { name: "Answer" })).toBeInTheDocument();
  });

  it("flips the card back when its answer is tapped", async () => {
    renderCards();
    await userEvent.click(await screen.findByRole("button", { name: /招待状/ }));

    await userEvent.click(screen.getByRole("button", { name: "Show the question" }));

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("region", { name: "Answer" })).toBeNull());
  });

  it("steps to the next card and back without rating it", async () => {
    renderCards();
    expect(await screen.findByRole("button", { name: "Previous card" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Next card" }));

    expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();
    expect(screen.getAllByText("2 / 2")).toHaveLength(2); // the phone header and the desktop heading
    expect(screen.getByRole("button", { name: "Next card" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Previous card" }));

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
    expect(screen.getByText("0 got it · 0 again")).toBeInTheDocument();
  });

  it("steps through the cards with the arrow keys", async () => {
    renderCards();
    await screen.findByRole("button", { name: /招待状/ });

    await userEvent.keyboard("{ArrowRight}");

    expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();

    await userEvent.keyboard("{ArrowLeft}");

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
  });

  describe("rating the cards", () => {
    it("marks a card got right the first time learned, and only that one", async () => {
      const requests = renderCards();

      await rate("Again");
      await rate("Got it");
      await rate("Got it");

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: "/kanji/N2/1/cards", body: { wordId: INVITE_ID } }]));
    });

    it("brings a card answered Again back, and counts the session on the way", async () => {
      renderCards();

      await rate("Again");

      expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();
      expect(screen.getByText("0 got it · 1 again")).toBeInTheDocument();

      await rate("Got it");

      expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
    });
  });

  describe("the end of the session", () => {
    it("sums it up, lists the cards still being learned, and studies them again", async () => {
      renderCards();
      await rate("Again");
      await rate("Got it");
      await rate("Got it");

      expect(await screen.findByRole("heading", { name: "Session done" })).toBeInTheDocument();
      expect(screen.getByText("2 cards · 1 got it first time · 1 needed again")).toBeInTheDocument();
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Still learning (1)" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Take the quiz" })).toHaveAttribute("href", "/tests/20261031-aaaaaa");

      await userEvent.click(screen.getByRole("button", { name: "Study it again" }));

      expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
    });

    it("links to the next cards and back to the chapters", async () => {
      renderCards();
      await rate("Got it");
      await rate("Got it");

      expect(await screen.findByRole("link", { name: "Next cards" })).toHaveAttribute("href", "/kanji/N2/1/cards");
      expect(screen.getByRole("link", { name: "Back to chapters" })).toHaveAttribute("href", "/kanji?level=N2");
      expect(screen.queryByRole("heading", { name: /Still learning/ })).toBeNull();
    });
  });

  it("links back to kanji", async () => {
    renderCards();

    expect(await screen.findByRole("link", { name: "← Kanji" })).toHaveAttribute("href", "/kanji?level=N2");
    expect(screen.getByRole("link", { name: "Back to kanji" })).toHaveAttribute("href", "/kanji?level=N2");
  });
});
