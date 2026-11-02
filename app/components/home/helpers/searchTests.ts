import type { TestSummary } from "~/lib/views";

/** Text as the search compares it: full-width letters and digits made plain, lower case, without the 〜 of a pattern. */
const plain = (text: string) => text.normalize("NFKC").toLowerCase().replace(/[〜~]/g, "");

/**
 * Whether `test` matches the search `query`: each word of it must be in the title or in a grammar pattern the test
 * covers. Null when it does not match; else the patterns that matched (none when the title alone did). An empty query
 * matches every test.
 */
export function matchOf(test: TestSummary, query: string): string[] | null {
  const words = plain(query).split(/\s+/).filter(Boolean);
  const title = plain(test.title);
  const matched = new Set<string>();
  for (const word of words) {
    const patterns = test.patterns.filter((pattern) => plain(pattern).includes(word));
    if (!title.includes(word) && patterns.length === 0) return null;
    if (!title.includes(word)) patterns.forEach((pattern) => matched.add(pattern));
  }
  return [...matched];
}
