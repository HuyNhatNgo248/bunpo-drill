import { useReducer, useRef, useState } from "react";
import { useFetchers, useSubmit } from "react-router";
import { sessionReducer, startSession, type Session } from "../helpers/session";

/** What the last tap did, said under the buttons and read out. */
export type Notice = "learned" | "gotIt" | "again" | "now" | "unlearned" | "undone";

/** The learned state sent for each word this visit, by id; a word not in it is as the server gave it. */
type Changes = Record<string, boolean>;

/**
 * A session over `cards`: the card on the table, ‹ and ›, Again and Got it (and undoing either), and the counts. Got it on
 * a card not missed this round marks it learned on the server at once, so leaving mid-session keeps it; Again on a learned
 * card (a review) marks it not learned. Each mark has its own fetcher, so quick taps don't cancel one another. With
 * `learn` false (notes), nothing is sent.
 */
export function useSession<C extends { wordId: string; learned?: boolean }>(cards: C[], learn = true) {
  const [session, dispatch] = useReducer(sessionReducer, cards, (all) => startSession(all.map((card) => card.wordId)));
  const [changes, setChanges] = useState<Changes>({});
  /** Each rating, with the session and the changes before it, newest last, for undo. */
  const [history, setHistory] = useState<{ before: Session; changes: Changes }[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const submit = useSubmit();
  const sent = useRef(0);
  const saveFailed = useFetchers().some((fetcher) => fetcher.key.startsWith("learn:") && (fetcher.data as { error?: string } | undefined)?.error);
  const byId = new Map(cards.map((card) => [card.wordId, card]));
  const cardsOf = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);
  const current = cardsOf(session.queue.slice(session.index, session.index + 1))[0];
  const isLearned = (id: string) => changes[id] ?? byId.get(id)?.learned ?? false;

  // A fresh key each time, so setting a word back right after marking it doesn't cancel the first POST.
  const send = (wordId: string, learned: boolean) =>
    void submit(learned ? { wordId } : { wordId, learned }, {
      method: "post",
      encType: "application/json",
      navigate: false,
      fetcherKey: `learn:${wordId}:${sent.current++}`,
    });

  const setLearned = (id: string, learned: boolean) => {
    send(id, learned);
    setChanges((all) => ({ ...all, [id]: learned }));
  };

  const rate = (type: "again" | "gotIt") => {
    if (!current) return;
    const { wordId } = current;
    const marking = learn && type === "gotIt" && !session.missed.includes(wordId) && !isLearned(wordId);
    const unmarking = learn && type === "again" && isLearned(wordId);
    if (marking || unmarking) setLearned(wordId, marking);
    setHistory((all) => [...all, { before: session, changes }]);
    // Again on the only card left brings it straight back.
    const alone = session.queue.length === 1;
    setNotice(marking ? "learned" : unmarking ? "unlearned" : type === "gotIt" ? "gotIt" : alone ? "now" : "again");
    dispatch({ type });
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    // Send back each word whose state the rating changed.
    for (const [id, learned] of Object.entries(changes)) {
      const before = last.changes[id] ?? byId.get(id)?.learned ?? false;
      if (before !== learned) send(id, before);
    }
    setChanges(last.changes);
    setHistory((all) => all.slice(0, -1));
    setNotice("undone");
    dispatch({ type: "restore", session: last.before });
  };

  const step = (type: "flip" | "prev" | "next") => {
    setNotice(null);
    dispatch({ type });
  };

  const total = session.done.length + session.queue.length;
  const done = session.done.length;
  return {
    current,
    flipped: session.flipped,
    flip: () => step("flip"),
    prev: session.index > 0 ? () => step("prev") : undefined,
    next: session.index < session.queue.length - 1 ? () => step("next") : undefined,
    again: () => rate("again"),
    gotIt: () => rate("gotIt"),
    /** Takes back the last Again or Got it; none before the first. */
    undo: history.length > 0 ? undo : undefined,
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
    /** The cards done of the session, as "3 / 20". */
    count: `${done} / ${total}`,
    /** Missed cards still waiting in the queue. */
    toRepeat: session.missed.filter((id) => session.queue.includes(id)).length,
    /** Got it the first time, in this round. */
    firstTry: session.done.filter((id) => !session.missed.includes(id)).length,
    missed: cardsOf(session.missed),
    /** How many more words are learned after this visit than before it. */
    learnedChange: Object.entries(changes).reduce((sum, [id, learned]) => sum + Number(learned) - Number(byId.get(id)?.learned ?? false), 0),
  };
}
