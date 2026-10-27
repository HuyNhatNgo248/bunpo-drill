import type { Active, Over } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { listAnnouncements } from "./announcements";

const TESTS = [
  buildTestSummary({ id: "20261027-aaaaaa", title: "第1週" }),
  buildTestSummary({ id: "20261027-bbbbbb", title: "第2週" }),
];

const ANNOUNCEMENTS = listAnnouncements(TESTS);

/** A test row as dnd-kit passes it: only its id is read. */
const row = (id: string) => ({ id }) as unknown as Active & Over;

describe("listAnnouncements", () => {
  it("names the test that is picked up", () => {
    expect(ANNOUNCEMENTS.onDragStart({ active: row("20261027-aaaaaa") })).toBe("「第1週」を持ち上げました。");
  });

  it("gives the place the test moves to, counted from 1", () => {
    expect(ANNOUNCEMENTS.onDragOver?.({ active: row("20261027-aaaaaa"), over: row("20261027-bbbbbb") })).toBe(
      "「第1週」を2番目に移動しました。",
    );
    expect(ANNOUNCEMENTS.onDragEnd({ active: row("20261027-aaaaaa"), over: row("20261027-bbbbbb") })).toBe(
      "「第1週」を2番目に置きました。",
    );
  });

  it("says nothing while the test is over no place", () => {
    expect(ANNOUNCEMENTS.onDragOver?.({ active: row("20261027-aaaaaa"), over: null })).toBeUndefined();
  });

  it("says that a cancelled move was undone", () => {
    expect(ANNOUNCEMENTS.onDragCancel({ active: row("20261027-bbbbbb"), over: null })).toBe("「第2週」の移動を取り消しました。");
  });
});
