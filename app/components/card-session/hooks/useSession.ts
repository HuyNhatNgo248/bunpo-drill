import { useReducer, useRef, useState } from "react";
import { useFetchers, useSubmit } from "react-router";
import { sessionReducer, startSession, type Session } from "../helpers/session";

/** What the last tap did, said under the buttons and read out. */
export type Notice = "learned" | "again" | "undone";

/**
 * A session over `cards`: the card on the table, ‹ and ›, Again and Got it (and undoing either), and the counts. A card got
 * right the first time is marked learned on the server at once, so leaving mid-session keeps it; each mark has its own
 * fetcher, so quick taps don't cancel one another. With `learn` false (notes), nothing is sent.
 */
export function useSession<C extends { wordId: string; learned?: boolean }>(cards: C[], learn = true) {
  const [session, dispatch] = useReducer(sessionReducer, cards, (all) => startSession(all.map((card) => card.wordId)));
  const [marked, setMarked] = useState<string[]>([]);
  /** Cards that were learned before the visit and were set back to not learned. */
  const [forgotten, setForgotten] = useState<string[]>([]);
  /** Each rating, with the session before it and the word it marked learned, newest last, for undo. */
  const [history, setHistory] = useState<{ before: Session; markedId: string | null }[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const submit = useSubmit();
  const sent = useRef(0);
  // A POST that came back with an error, or that a failed request left without an answer.
  const saveFailed = useFetchers().some((fetcher) => fetcher.key.startsWith("learn:") && (fetcher.data as { error?: string } | undefined)?.error);
  const byId = new Map(cards.map((card) => [card.wordId, card]));
  const cardsOf = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);
  const current = cardsOf(session.queue.slice(session.index, session.index + 1))[0];

  // A fresh key each time, so setting a word back right after marking it doesn't cancel the first POST.
  const send = (body: { wordId: string; learned?: false }) =>
    void submit(body, { method: "post", encType: "application/json", navigate: false, fetcherKey: `learn:${body.wordId}:${sent.current++}` });

  const rate = (type: "again" | "gotIt") => {
    if (!current) return;
    const { wordId } = current;
    const marking = type === "gotIt" && learn && !session.missed.includes(wordId) && !marked.includes(wordId);
    if (marking) {
      send({ wordId });
      setMarked((ids) => [...ids, wordId]);
    }
    setHistory((all) => [...all, { before: session, markedId: marking ? wordId : null }]);
    setNotice(type === "gotIt" ? "learned" : "again");
    dispatch({ type });
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    if (last.markedId) {
      send({ wordId: last.markedId, learned: false });
      setMarked((ids) => ids.filter((id) => id !== last.markedId));
    }
    setHistory((all) => all.slice(0, -1));
    setNotice("undone");
    dispatch({ type: "restore", session: last.before });
  };

  const forget = () => {
    if (!current) return;
    send({ wordId: current.wordId, learned: false });
    setForgotten((ids) => [...ids, current.wordId]);
  };

  const step = (type: "flip" | "prev" | "next") => {
    setNotice(null);
    dispatch({ type });
  };

  const total = session.done.length + session.queue.length;
  const done = session.done.length;
  return {
    current,
    learn,
    flipped: session.flipped,
    flip: () => step("flip"),
    prev: session.index > 0 ? () => step("prev") : undefined,
    next: session.index < session.queue.length - 1 ? () => step("next") : undefined,
    again: () => rate("again"),
    gotIt: () => rate("gotIt"),
    /** Takes back the last Again or Got it; none before the first. */
    undo: history.length > 0 ? undo : undefined,
    /** Sets the card on the table back to not learned, when it was learned before the visit. */
    forget: learn && current?.learned && !forgotten.includes(current.wordId) ? forget : undefined,
    notice,
    saveFailed,
    studyAgain: () => {
      setHistory([]);
      setNotice(null);
      dispatch({ type: "restart", wordIds: session.missed });
    },
    total,
    done,
    /** The cards done, as a share of the bar. */
    percent: total === 0 ? 100 : (done / total) * 100,
    /** Where the card on the table is in the deck, as "4 / 20": the cards done, then its place among the rest. */
    position: `${Math.min(done + session.index + 1, total)} / ${total}`,
    /** Got it the first time, in this round. */
    firstTry: session.done.filter((id) => !session.missed.includes(id)).length,
    missed: cardsOf(session.missed),
    /** How many more words are learned after this visit than before it. */
    learnedChange: cardsOf(marked).filter((card) => !card.learned).length - forgotten.length,
  };
}
