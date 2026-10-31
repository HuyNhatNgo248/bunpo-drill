import type { Level } from "./payload";
import type { TestKind } from "./views";

/**
 * Where a test's pages lead back to: the mock tests, or the kanji chapters of its level.
 *
 * @example
 * homeOf({ kind: "kanji", level: "N2" }); // -> "/kanji?level=N2"
 */
export const homeOf = ({ kind, level }: { kind: TestKind; level: Level }): string => (kind === "kanji" ? `/kanji?level=${level}` : "/");

/**
 * A chapter's flashcards: the words not learned yet, or only `wordIds`.
 *
 * @example
 * cardsOf("N2", 1, ["n2-c1-渡航"]); // -> "/kanji/N2/1/cards?words=n2-c1-%E6%B8%A1%E8%88%AA"
 */
export function cardsOf(level: Level, chapter: number, wordIds: string[] = []): string {
  const path = `/kanji/${level}/${chapter}/cards`;
  return wordIds.length ? `${path}?${new URLSearchParams({ words: wordIds.join(",") })}` : path;
}
