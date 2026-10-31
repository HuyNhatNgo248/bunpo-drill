import type { Active, Over } from "@dnd-kit/core";
import { i18n } from "@lingui/core";
import { describe, expect, it } from "vitest";
import { buildTestSummary } from "#mocks/factories/views";
import { listAnnouncements } from "./announcements";

const TESTS = [
  buildTestSummary({ id: "20261027-aaaaaa", title: "第1週" }),
  buildTestSummary({ id: "20261027-bbbbbb", title: "第2週" }),
];

const ANNOUNCEMENTS = listAnnouncements(TESTS, i18n);

/** A test row as dnd-kit passes it: only its id is read. */
const row = (id: string) => ({ id }) as unknown as Active & Over;

describe("listAnnouncements", () => {
  it("names the test that is picked up", () => {
    expect(ANNOUNCEMENTS.onDragStart({ active: row("20261027-aaaaaa") })).toBe("Picked up “第1週”.");
  });

  it("gives the place the test moves to, counted from 1", () => {
    expect(ANNOUNCEMENTS.onDragOver?.({ active: row("20261027-aaaaaa"), over: row("20261027-bbbbbb") })).toBe(
      "Moved “第1週” to place 2.",
    );
    expect(ANNOUNCEMENTS.onDragEnd({ active: row("20261027-aaaaaa"), over: row("20261027-bbbbbb") })).toBe(
      "Put “第1週” down in place 2.",
    );
  });

  it("says nothing while the test is over no place", () => {
    expect(ANNOUNCEMENTS.onDragOver?.({ active: row("20261027-aaaaaa"), over: null })).toBeUndefined();
  });

  it("says that a cancelled move was undone", () => {
    expect(ANNOUNCEMENTS.onDragCancel({ active: row("20261027-bbbbbb"), over: null })).toBe("Cancelled moving “第2週”.");
  });
});
