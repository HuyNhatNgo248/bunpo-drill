/** The keys of the fetchers that change the list. The list reads them to show a change before it is saved. */
export const REORDER_KEY = "reorder";

const DELETE_ACTION = "/api/tests/";

/** The ids of the tests that a fetcher deletes at the moment. */
export function deletingIds(fetchers: { formMethod?: string; formAction?: string }[]): Set<string> {
  return new Set(
    fetchers
      .filter((f) => f.formMethod === "DELETE" && f.formAction?.startsWith(DELETE_ACTION))
      .map((f) => f.formAction!.slice(DELETE_ACTION.length)),
  );
}
