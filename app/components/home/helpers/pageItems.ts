/**
 * The pages to link to: the first, the last and the current one, with "…" for each gap between them, or the page
 * itself when the gap is one page. Five at most, so the row fits a phone with its previous and next links.
 */
export function pageItems(page: number, pages: number): (number | "…")[] {
  const shown = [...new Set([1, page, pages])].sort((a, b) => a - b);
  return shown.flatMap((item, index) => {
    const gap = item - (shown[index - 1] ?? item - 1);
    return gap === 1 ? [item] : gap === 2 ? [item - 1, item] : ["…" as const, item];
  });
}
