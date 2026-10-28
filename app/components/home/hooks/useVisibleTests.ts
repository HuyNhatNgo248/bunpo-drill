import { useFetcher, useFetchers } from "react-router";
import type { TestSummary } from "~/lib/views";
import { deletingIds, REORDER_KEY } from "../helpers/fetchers";
import { visibleTests } from "../helpers/visibleTests";

/** The saved tests, with the deletes and the reorder that are saving now already applied. */
export function useVisibleTests(tests: TestSummary[]): TestSummary[] {
  const reorder = useFetcher({ key: REORDER_KEY });
  const deleting = deletingIds(useFetchers());
  return visibleTests(tests, {
    deleting,
    order: reorder.state === "idle" ? null : (reorder.json as { order: string[] }).order,
  });
}
