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
    buildFlashCard({
      related: [{ word: "招く", reading: "まねく" }],
      examples: [{ sentence: { before: "友人の結婚式の", word: "招待状", after: "が届いた。" }, meaning: "The invitation to my friend's wedding arrived." }],
    }),
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
  it("says the session is a slice of a bigger chapter, and how many words are left", async () => {
    renderRoute(<Flashcards view={{ ...VIEW, words: 156, learned: 6 }} />, { url: "/kanji/N2/1/cards", action: recordingAction().action });

    expect(await screen.findByText("150 of 156 words in this chapter still to learn · 8 sets to go")).toBeInTheDocument();
  });

  it("names the lesson of a session on one, counts its words, and keeps it for the next cards", async () => {
    renderRoute(<Flashcards view={{ ...VIEW, lesson: { title: "料理", page: 21 }, words: 27, learned: 2 }} />, {
      url: "/kanji/N2/1/cards?page=21",
      action: recordingAction().action,
    });

    expect(await screen.findByRole("heading", { name: /料理/ })).toBeInTheDocument();
    expect(screen.getByText("25 of 27 words in this lesson still to learn · 2 sets to go")).toBeInTheDocument();
    await rate("Got it");
    await rate("Got it");
    expect(await screen.findByRole("link", { name: "Next set" })).toHaveAttribute("href", expect.stringMatching(/^\/kanji\/N2\/1\/cards\?page=21&seen=/));
  });

  it("shows a word on the front, and its reading, meaning and kanji readings on the back", async () => {
    renderCards();

    expect(await screen.findByRole("button", { name: /招待状/ })).not.toHaveTextContent("しょうたいじょう");
    expect(screen.queryByRole("region", { name: "Answer" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Show answer" }));

    const answer = screen.getByRole("region", { name: "Answer" });
    expect(within(answer).getByText("しょうたいじょう")).toBeInTheDocument();
    expect(within(answer).getByText("invitation card")).toBeInTheDocument();
    expect(within(answer).getByText("まね-く")).toBeInTheDocument();
    expect(within(answer).getByText("8 strokes")).toBeInTheDocument();
    expect(within(answer).getByText("まねく")).toBeInTheDocument();
    expect(within(answer).getByText("The invitation to my friend's wedding arrived.")).toBeInTheDocument();
  });

  it("shows the reading and the meaning on the front in 表記, to write the word", async () => {
    renderCards();

    // The switch is in the progress card on a desktop and in a row of its own on a phone: both are on the page.
    await userEvent.click((await screen.findAllByRole("button", { name: /表記/ }))[0]!);

    const front = screen.getByRole("button", { name: /しょうたいじょう/ });
    expect(front).toHaveTextContent("invitation card");
    expect(front).not.toHaveTextContent("招待状");
  });

  it("flips the card when it is tapped", async () => {
    renderCards();

    await userEvent.click(await screen.findByRole("button", { name: /招待状/ }));

    expect(screen.getByRole("region", { name: "Answer" })).toBeInTheDocument();
  });

  it("flips the card back when its answer is tapped, or with its button for the keyboard", async () => {
    renderCards();
    await userEvent.click(await screen.findByRole("button", { name: /招待状/ }));

    await userEvent.click(screen.getByRole("region", { name: "Answer" }));

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Answer" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /招待状/ }));
    await userEvent.click(screen.getByRole("button", { name: "Show the question" }));

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
  });

  it("steps to the next card and back without rating it", async () => {
    renderCards();
    expect(await screen.findByRole("button", { name: "Previous card" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Next card" }));

    expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();
    expect(screen.getAllByText("0 / 2")).toHaveLength(1); // the phone header: cards done, not the place in the deck
    expect(screen.getByRole("button", { name: "Next card" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Previous card" }));

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
    expect(screen.queryByText(/to repeat/)).toBeNull();
  });

  it("steps through the cards with the arrow keys", async () => {
    renderCards();
    await screen.findByRole("button", { name: /招待状/ });

    await userEvent.keyboard("{ArrowRight}");

    expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();

    await userEvent.keyboard("{ArrowLeft}");

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();
  });

  it("flips the card with Space, and with the up and down arrow keys", async () => {
    renderCards();
    await screen.findByRole("button", { name: /招待状/ });

    await userEvent.keyboard(" ");

    expect(await screen.findByRole("region", { name: "Answer" })).toBeInTheDocument();

    await userEvent.keyboard("{ArrowDown}");

    expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();

    await userEvent.keyboard("{ArrowUp}");

    expect(await screen.findByRole("region", { name: "Answer" })).toBeInTheDocument();
  });

  it("leaves Space to a focused button", async () => {
    renderCards();
    await screen.findByRole("button", { name: /招待状/ });
    screen.getByRole("button", { name: "Next card" }).focus();

    await userEvent.keyboard(" ");

    expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Answer" })).toBeNull();
  });

  describe("rating the cards", () => {
    it("marks a card got right the first time learned, and only that one", async () => {
      const requests = renderCards();

      await rate("Again");
      await rate("Got it");
      await rate("Got it");

      await waitFor(() => expect(requests).toEqual([{ method: "POST", path: "/kanji/N2/1/cards", body: { wordId: INVITE_ID } }]));
    });

    it("takes back the last rating with Undo, and sets a card marked learned back to not learned", async () => {
      const requests = renderCards();

      await rate("Got it");
      await userEvent.click(await screen.findByRole("button", { name: "Undo" }));

      // Back on the card it was, with its answer showing, to rate again.
      expect(await screen.findByRole("region", { name: "Answer" })).toHaveTextContent("招待状");
      expect(screen.getByText("Undone")).toBeInTheDocument();
      await waitFor(() =>
        expect(requests.map((request) => request.body)).toEqual([{ wordId: VIEW.cards[0]?.wordId }, { wordId: VIEW.cards[0]?.wordId, learned: false }]),
      );
    });

    it("rates with the 1 and 2 keys once the answer is shown", async () => {
      renderCards();
      await userEvent.keyboard("2");
      expect(await screen.findByRole("button", { name: /招待状/ })).toBeInTheDocument();

      await userEvent.keyboard(" 1");

      expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();
      expect(screen.getByText("1 to repeat")).toBeInTheDocument();
    });

    it("brings a card answered Again back, and counts the session on the way", async () => {
      renderCards();

      await rate("Again");

      expect(await screen.findByRole("button", { name: /招く/ })).toBeInTheDocument();
      expect(screen.getByText("1 to repeat")).toBeInTheDocument();

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

    it("links to the next cards, leaving out the ones just seen, and back to the chapters", async () => {
      renderRoute(<Flashcards view={{ ...VIEW, words: 5 }} />, { url: "/kanji/N2/1/cards", action: recordingAction().action });
      await rate("Got it");
      await rate("Got it");

      expect(await screen.findByRole("link", { name: "Next set" })).toHaveAttribute(
        "href",
        `/kanji/N2/1/cards?seen=${encodeURIComponent(`${VIEW.cards[0]?.wordId},${INVITE_ID}`)}`,
      );
      // The phone header's back link.
      for (const link of screen.getAllByRole("link", { name: "Back to lessons" })) expect(link).toHaveAttribute("href", "/kanji?level=N2&chapter=1");
      expect(screen.queryByRole("heading", { name: /Still learning/ })).toBeNull();
    });

    it("says the chapter is done on the last set, and offers a review instead of next cards", async () => {
      renderCards();
      await rate("Got it");
      await rate("Got it");

      expect(await screen.findByText(/That was the last set/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Review again" })).toHaveAttribute("href", "/kanji/N2/1/cards?review=1");
      expect(screen.queryByRole("link", { name: "Next set" })).toBeNull();
    });

    it("opens on the finished screen, not a card, when every word is learned", async () => {
      renderRoute(<Flashcards view={{ ...VIEW, cards: [], learned: 2 }} />, { url: "/kanji/N2/1/cards", action: recordingAction().action });

      expect(await screen.findByRole("heading", { name: "All words learned" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Review again" })).toBeInTheDocument();
    });
  });

  it("keeps the side picked for the next visit", async () => {
    renderCards();
    await userEvent.click((await screen.findAllByRole("button", { name: /表記/ }))[0]!);

    expect(localStorage.getItem("flashcard-mode")).toBe("kanji-writing");
    localStorage.removeItem("flashcard-mode");
  });

  describe("a review of learned words", () => {
    const REVIEW = { ...VIEW, source: "review" as const, learned: 2, cards: VIEW.cards.map((card) => ({ ...card, learned: true })) };

    it("sets a card answered Again back to not learned, and says so", async () => {
      const { action, requests } = recordingAction();
      renderRoute(<Flashcards view={REVIEW} />, { url: "/kanji/N2/1/cards?review=1", action });

      await rate("Again");

      expect(screen.getByText("Back on your list to learn")).toBeInTheDocument();
      await waitFor(() => expect(requests.map((request) => request.body)).toEqual([{ wordId: VIEW.cards[0]?.wordId, learned: false }]));
    });

    it("sends nothing for Got it on a learned card, so Undo can't unlearn it", async () => {
      const { action, requests } = recordingAction();
      renderRoute(<Flashcards view={REVIEW} />, { url: "/kanji/N2/1/cards?review=1", action });

      await rate("Got it");
      expect(screen.getByText("Got it", { selector: "p" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Undo" }));

      expect(await screen.findByText("Undone")).toBeInTheDocument();
      expect(requests).toEqual([]);
    });
  });

  it("leads on to the next lesson once a lesson is learned, and offers a reset only then", async () => {
    renderRoute(
      <Flashcards view={{ ...VIEW, lesson: { title: "料理", page: 21 }, nextLesson: { title: "旅行", page: 25 }, words: 2 }} />,
      { url: "/kanji/N2/1/cards?page=21", action: recordingAction().action },
    );
    expect(screen.queryByRole("button", { name: "Reset progress" })).toBeNull();

    await rate("Got it");
    await rate("Got it");

    expect(await screen.findByRole("link", { name: "Next lesson: 旅行" })).toHaveAttribute("href", "/kanji/N2/1/cards?page=25");
    expect(screen.getByRole("button", { name: "Reset progress" })).toBeInTheDocument();
  });

  it("links back to the lessons", async () => {
    renderCards();

    expect(await screen.findByRole("link", { name: "← Lessons" })).toHaveAttribute("href", "/kanji?level=N2&chapter=1");
    expect(screen.getByRole("link", { name: "Back to lessons" })).toHaveAttribute("href", "/kanji?level=N2&chapter=1");
  });
});
