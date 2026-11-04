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
    expect(session).toEqual({ queue: ["b", "c", "d", "a", "e"], index: 0, flipped: false, missed: ["a"], done: [] });
    expect(after(["a"], { type: "again" }, { type: "again" }).missed).toEqual(["a"]);
  });

  it("puts a card answered Again last when fewer cards are left", () => {
    expect(after(["a", "b"], { type: "again" }).queue).toEqual(["b", "a"]);
  });

  it("takes a card answered Got it off the queue, and counts it done", () => {
    expect(after(["a", "b"], { type: "flip" }, { type: "gotIt" })).toEqual({ queue: ["b"], index: 0, flipped: false, missed: [], done: ["a"] });
  });

  it("steps to the next and previous cards face down, and stops at either end", () => {
    const ids = ["a", "b", "c"];

    expect(after(ids, { type: "next" }, { type: "flip" }, { type: "next" })).toMatchObject({ index: 2, flipped: false });
    expect(after(ids, { type: "next" }, { type: "next" }, { type: "next" }).index).toBe(2);
    expect(after(ids, { type: "next" }, { type: "prev" }, { type: "prev" }).index).toBe(0);
  });

  it("rates the card it has stepped to, then goes on to the card after it", () => {
    const ids = ["a", "b", "c", "d", "e"];

    expect(after(ids, { type: "next" }, { type: "gotIt" })).toMatchObject({ queue: ["a", "c", "d", "e"], index: 1, done: ["b"] });
    expect(after(ids, { type: "next" }, { type: "again" })).toMatchObject({ queue: ["a", "c", "d", "e", "b"], index: 1, missed: ["b"] });
  });

  it("goes back to the first card left after rating the last one", () => {
    const ids = ["a", "b", "c"];

    expect(after(ids, { type: "next" }, { type: "next" }, { type: "gotIt" })).toMatchObject({ queue: ["a", "b"], index: 0 });
    expect(after(ids, { type: "next" }, { type: "next" }, { type: "again" })).toMatchObject({ queue: ["a", "b", "c"], index: 0 });
  });

  it("does nothing to an empty queue", () => {
    expect(after([], { type: "again" }, { type: "gotIt" }, { type: "next" }, { type: "prev" })).toEqual(startSession([]));
  });

  it("starts again on the cards given, with nothing missed or done", () => {
    expect(after(["a", "b"], { type: "again" }, { type: "restart", wordIds: ["a"] })).toEqual(startSession(["a"]));
  });
});
