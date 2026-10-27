import type { Announcements, UniqueIdentifier } from "@dnd-kit/core";
import type { TestSummary } from "~/lib/views";

/** What a screen reader hears while a test is dragged to a new place. dnd-kit's own words are English. */
export function listAnnouncements(tests: TestSummary[]): Announcements {
  const titleOf = (id: UniqueIdentifier) => tests.find((test) => test.id === id)?.title;
  const placeOf = (id: UniqueIdentifier) => tests.findIndex((test) => test.id === id) + 1;
  return {
    onDragStart: ({ active }) => `「${titleOf(active.id)}」を持ち上げました。`,
    onDragOver: ({ active, over }) => (over ? `「${titleOf(active.id)}」を${placeOf(over.id)}番目に移動しました。` : undefined),
    onDragEnd: ({ active, over }) => (over ? `「${titleOf(active.id)}」を${placeOf(over.id)}番目に置きました。` : undefined),
    onDragCancel: ({ active }) => `「${titleOf(active.id)}」の移動を取り消しました。`,
  };
}
