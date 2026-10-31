import { describe, expect, it } from "vitest";
import { AGAIN_GAP, sessionReducer, startSession, type Session, type SessionAction } from "./session";

/** The session after `actions`, from a queue of `ids`. */
const after = (ids: string[], ...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession(ids));

describe("sessionReducer", () => {
  it("flips the card on the table, and back", () => {
    expect(after(["a"], { type: "flip" }).flipped).toBe(true);
    expect(after(["a"], { type: "flip" }, { type: "flip" }).flipped).toBe(false);
  });

  it("puts a card answered Again back AGAIN_GAP cards later, face down, and keeps it as missed once", () => {
    const ids = ["a", "b", "c", "d", "e"];

    const session = after(ids, { type: "flip" }, { type: "again" });

    expect(AGAIN_GAP).toBe(3);
    expect(session).toEqual({ queue: ["b", "c", "d", "a", "e"], flipped: false, missed: ["a"], done: [] });
    expect(after(["a"], { type: "again" }, { type: "again" }).missed).toEqual(["a"]);
  });

  it("puts a card answered Again last when fewer cards are left", () => {
    expect(after(["a", "b"], { type: "again" }).queue).toEqual(["b", "a"]);
  });

  it("takes a card answered Got it off the queue, and counts it done", () => {
    expect(after(["a", "b"], { type: "flip" }, { type: "gotIt" })).toEqual({ queue: ["b"], flipped: false, missed: [], done: ["a"] });
  });

  it("does nothing to an empty queue", () => {
    expect(after([], { type: "again" }, { type: "gotIt" })).toEqual(startSession([]));
  });

  it("starts again on the cards given, with nothing missed or done", () => {
    expect(after(["a", "b"], { type: "again" }, { type: "restart", wordIds: ["a"] })).toEqual(startSession(["a"]));
  });
});
