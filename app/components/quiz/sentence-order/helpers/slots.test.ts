import { describe, expect, it } from "vitest";
import { EMPTY_SLOTS, placeInNextSlot, placePiece, removePiece } from "./slots";

describe("placePiece", () => {
  it("puts a piece in an empty slot", () => {
    expect(placePiece(EMPTY_SLOTS, 2, 1)).toEqual([null, 2, null, null]);
  });

  it("moves a placed piece, so a piece is never in two slots", () => {
    expect(placePiece([2, null, null, null], 2, 3)).toEqual([null, null, null, 2]);
  });

  it("swaps two placed pieces", () => {
    expect(placePiece([2, 0, null, null], 2, 1)).toEqual([0, 2, null, null]);
  });

  it("returns new slots and leaves the old ones as they were", () => {
    const slots = [2, null, null, null];

    placePiece(slots, 1, 1);

    expect(slots).toEqual([2, null, null, null]);
  });
});

describe("removePiece", () => {
  it("empties the slot of the piece", () => {
    expect(removePiece([2, 0, 1, 3], 0)).toEqual([2, null, 1, 3]);
  });

  it("changes nothing for a piece that is not placed", () => {
    expect(removePiece([2, null, null, null], 3)).toEqual([2, null, null, null]);
  });
});

describe("placeInNextSlot", () => {
  it("puts the piece in the first empty slot", () => {
    expect(placeInNextSlot([2, null, 1, null], 0)).toEqual([2, 0, 1, null]);
  });

  it("returns null for a piece that is already placed", () => {
    expect(placeInNextSlot([2, null, null, null], 2)).toBeNull();
  });

  it("returns null when every slot is full", () => {
    expect(placeInNextSlot([2, 0, 1, 3], 1)).toBeNull();
  });
});
