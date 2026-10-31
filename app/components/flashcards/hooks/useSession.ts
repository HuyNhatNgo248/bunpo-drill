import { useReducer, useState } from "react";
import { useSubmit } from "react-router";
import type { FlashCard } from "~/lib/views";
import { sessionReducer, startSession } from "../helpers/session";

/**
 * A session over `cards`: the card on the table, ‹ and ›, Again and Got it, and the counts. A card got right the first time is
 * marked learned on the server at once, so leaving mid-session keeps it; each mark has its own fetcher, so quick taps
 * don't cancel one another.
 */
export function useSession(cards: FlashCard[]) {
  const [session, dispatch] = useReducer(sessionReducer, cards, (all) => startSession(all.map((card) => card.wordId)));
  const [marked, setMarked] = useState<string[]>([]);
  const submit = useSubmit();
  const byId = new Map(cards.map((card) => [card.wordId, card]));
  const cardsOf = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);
  const current = cardsOf(session.queue.slice(session.index, session.index + 1))[0];

  const gotIt = () => {
    if (!current) return;
    const { wordId } = current;
    if (!session.missed.includes(wordId) && !marked.includes(wordId)) {
      void submit({ wordId }, { method: "post", encType: "application/json", navigate: false, fetcherKey: `learn:${wordId}` });
      setMarked((ids) => [...ids, wordId]);
    }
    dispatch({ type: "gotIt" });
  };

  const total = session.done.length + session.queue.length;
  return {
    current,
    flipped: session.flipped,
    flip: () => dispatch({ type: "flip" }),
    prev: session.index > 0 ? () => dispatch({ type: "prev" }) : undefined,
    next: session.index < session.queue.length - 1 ? () => dispatch({ type: "next" }) : undefined,
    again: () => dispatch({ type: "again" }),
    gotIt,
    studyAgain: () => dispatch({ type: "restart", wordIds: session.missed }),
    total,
    done: session.done.length,
    /** Where the card on the table is in the deck: the cards done, then its place among the rest. */
    position: session.done.length + session.index + 1,
    /** Got it the first time, in this round. */
    firstTry: session.done.filter((id) => !session.missed.includes(id)).length,
    missed: cardsOf(session.missed),
    /** Cards learned in this visit that weren't learned before it. */
    newlyLearned: cardsOf(marked).filter((card) => !card.learned).length,
  };
}
