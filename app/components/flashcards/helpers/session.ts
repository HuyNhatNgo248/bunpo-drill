/**
 * A flashcard session as a queue of word ids, the current card first. Again puts the card back a few cards later;
 * Got it takes it out. A card missed once stays missed for the session, so it isn't marked learned.
 */
export type Session = {
  queue: string[];
  flipped: boolean;
  /** The cards answered Again at least once, in the order first missed. */
  missed: string[];
  /** The cards answered Got it, in order. */
  done: string[];
};

export type SessionAction = { type: "flip" } | { type: "again" } | { type: "gotIt" } | { type: "restart"; wordIds: string[] };

/** How many cards come before a card answered Again, when there are that many left. */
export const AGAIN_GAP = 3;

export const startSession = (wordIds: string[]): Session => ({ queue: wordIds, flipped: false, missed: [], done: [] });

/**
 * @example
 * sessionReducer(startSession(["a", "b"]), { type: "again" }).queue; // -> ["b", "a"]
 */
export function sessionReducer(session: Session, action: SessionAction): Session {
  const [current, ...rest] = session.queue;
  switch (action.type) {
    case "flip":
      return { ...session, flipped: !session.flipped };
    case "again":
      if (!current) return session;
      return {
        ...session,
        queue: [...rest.slice(0, AGAIN_GAP), current, ...rest.slice(AGAIN_GAP)],
        flipped: false,
        missed: session.missed.includes(current) ? session.missed : [...session.missed, current],
      };
    case "gotIt":
      if (!current) return session;
      return { ...session, queue: rest, flipped: false, done: [...session.done, current] };
    case "restart":
      return startSession(action.wordIds);
  }
}
