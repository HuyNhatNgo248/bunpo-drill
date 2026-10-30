import { useFetcher } from "react-router";
import type { TestSummary } from "~/lib/views";
import { REORDER_KEY } from "../helpers/fetchers";
import { visibleTests } from "../helpers/visibleTests";

/** The saved tests, with the reorder that is saving now already applied. */
export function useVisibleTests(tests: TestSummary[]): TestSummary[] {
  const reorder = useFetcher({ key: REORDER_KEY });
  return visibleTests(tests, { order: reorder.state === "idle" ? null : (reorder.json as { order: string[] }).order });
}
