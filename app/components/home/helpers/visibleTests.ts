import type { TestSummary } from "~/lib/views";

/** The changes that are saving now: tests being deleted, a new order. */
export type PendingChanges = { deleting: Set<string>; order: string[] | null };

/**
 * The tests to show while changes save, so the list changes at once instead of after the reload:
 * no deleted tests, and a dragged test in its new place.
 */
export function visibleTests(tests: TestSummary[], pending: PendingChanges): TestSummary[] {
  const shown = tests.filter((test) => !pending.deleting.has(test.id));
  const { order } = pending;
  if (order) shown.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return shown;
}
