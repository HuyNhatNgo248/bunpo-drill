import type { Active, Over } from "@dnd-kit/core";
import { i18n } from "@lingui/core";
import { describe, expect, it } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import type { DragData, DropData, OrderQuestion } from "../types";
import { pieceAnnouncements } from "./announcements";

/** q2 of the built quiz: pieces 練習した, 毎日, かいが, あって, with the ★ in slot 3. */
const QUESTION = buildQuizView().sections[1].groups[0].questions[0] as OrderQuestion;

const ANNOUNCEMENTS = pieceAnnouncements(QUESTION, i18n);

/** The dragged piece, as dnd-kit passes it. */
const dragged = (piece: number) => ({ data: { current: { piece } satisfies DragData } }) as unknown as Active;

/** The zone under the piece, as dnd-kit passes it. */
const zone = (data: DropData) => ({ data: { current: data } }) as unknown as Over;

describe("pieceAnnouncements", () => {
  it("names the piece that is picked up", () => {
    expect(ANNOUNCEMENTS.onDragStart({ active: dragged(2) })).toBe("Picked up “かいが”.");
  });

  it("names the slot under the piece, and calls the ★ slot by its mark", () => {
    expect(ANNOUNCEMENTS.onDragOver?.({ active: dragged(0), over: zone({ slot: 0 }) })).toBe("“練習した” is over slot 1.");
    expect(ANNOUNCEMENTS.onDragOver?.({ active: dragged(0), over: zone({ slot: 2 }) })).toBe("“練習した” is over the ★ slot.");
  });

  it("says where the piece was put, or that it went back", () => {
    expect(ANNOUNCEMENTS.onDragEnd({ active: dragged(1), over: zone({ bank: true }) })).toBe("Put “毎日” in the choices.");
    expect(ANNOUNCEMENTS.onDragEnd({ active: dragged(1), over: null })).toBe("Put “毎日” back.");
  });

  it("says nothing while the piece is over no zone", () => {
    expect(ANNOUNCEMENTS.onDragOver?.({ active: dragged(1), over: null })).toBeUndefined();
  });

  it("says that a cancelled move was undone", () => {
    expect(ANNOUNCEMENTS.onDragCancel({ active: dragged(3), over: null })).toBe("Cancelled moving “あって”.");
  });
});
