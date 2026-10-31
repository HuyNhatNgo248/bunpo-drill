/**
 * A flashcard session as a queue of word ids, in book order, with the card on the table at `index`. ‹ and › move along
 * it without rating; Again puts the card back a few cards later, Got it takes it out, and both go on to the next card
 * (the first one left, after the last). A card missed once stays missed for the session, so it isn't marked learned.
 */
export type Session = {
  queue: string[];
  index: number;
  flipped: boolean;
  /** The cards answered Again at least once, in the order first missed. */
  missed: string[];
  /** The cards answered Got it, in order. */
  done: string[];
};

export type SessionAction =
  | { type: "flip" }
  | { type: "prev" }
  | { type: "next" }
  | { type: "again" }
  | { type: "gotIt" }
  | { type: "restart"; wordIds: string[] };

/** How many cards come before a card answered Again, when there are that many left. */
export const AGAIN_GAP = 3;

export const startSession = (wordIds: string[]): Session => ({ queue: wordIds, index: 0, flipped: false, missed: [], done: [] });

/**
 * @example
 * sessionReducer(startSession(["a", "b"]), { type: "again" }).queue; // -> ["b", "a"]
 */
export function sessionReducer(session: Session, action: SessionAction): Session {
  const { queue, index } = session;
  const current = queue[index];
  const rest = [...queue.slice(0, index), ...queue.slice(index + 1)];
  // The card after the one rated is at the same index, once it is out of the way.
  const following = index < rest.length ? index : 0;
  switch (action.type) {
    case "flip":
      return { ...session, flipped: !session.flipped };
    case "prev":
      return index > 0 ? { ...session, index: index - 1, flipped: false } : session;
    case "next":
      return index < queue.length - 1 ? { ...session, index: index + 1, flipped: false } : session;
    case "again":
      if (!current) return session;
      return {
        ...session,
        queue: [...rest.slice(0, index + AGAIN_GAP), current, ...rest.slice(index + AGAIN_GAP)],
        index: following,
        flipped: false,
        missed: session.missed.includes(current) ? session.missed : [...session.missed, current],
      };
    case "gotIt":
      if (!current) return session;
      return { ...session, queue: rest, index: following, flipped: false, done: [...session.done, current] };
    case "restart":
      return startSession(action.wordIds);
  }
}
