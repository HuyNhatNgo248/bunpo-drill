import type { TestSummary } from "~/lib/views";

/** The change that is saving now: a new order. */
export type PendingChanges = { order: string[] | null };

/** The tests to show while a new order saves, so a dragged test takes its place at once instead of after the reload. */
export function visibleTests(tests: TestSummary[], pending: PendingChanges): TestSummary[] {
  const shown = [...tests];
  const { order } = pending;
  if (order) shown.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return shown;
}
