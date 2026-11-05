import type { Level } from "./payload";
import type { TestKind } from "./views";

/**
 * Where a test's pages lead back to: the mock tests, or the kanji chapters of its level, at its chapter when it has one.
 *
 * @example
 * homeOf({ kind: "kanji", level: "N2", chapter: 3 }); // -> "/kanji?level=N2&chapter=3"
 */
export const homeOf = ({ kind, level, chapter }: { kind: TestKind; level: Level; chapter?: number | null }): string =>
  kind === "kanji" ? `/kanji?level=${level}${chapter ? `&chapter=${chapter}` : ""}` : "/";

/**
 * A chapter's flashcards: the words not learned yet, of the lesson on `page` when given, or only `words`.
 *
 * @example
 * cardsOf("N2", 1, { words: ["n2-c1-渡航"] }); // -> "/kanji/N2/1/cards?words=n2-c1-%E6%B8%A1%E8%88%AA"
 * cardsOf("N2", 1, { page: 21 }); // -> "/kanji/N2/1/cards?page=21"
 */
export function cardsOf(level: Level, chapter: number, { words = [], page }: { words?: string[]; page?: number } = {}): string {
  const search = new URLSearchParams();
  if (words.length) search.set("words", words.join(","));
  if (page) search.set("page", String(page));
  const path = `/kanji/${level}/${chapter}/cards`;
  return search.size ? `${path}?${search}` : path;
}
