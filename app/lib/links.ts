import type { Level } from "./payload";
import type { TestKind } from "./views";

/**
 * Where a test's pages lead back to: the mock tests, the kanji chapters of its level at its chapter, or the reading
 * sets of its level at its group (`chapter` holds a reading set's group).
 *
 * @example
 * homeOf({ kind: "kanji", level: "N2", chapter: 3 }); // -> "/kanji?level=N2&chapter=3"
 * homeOf({ kind: "reading", level: "N2", chapter: 1 }); // -> "/reading?level=N2&group=1"
 */
export const homeOf = ({ kind, level, chapter }: { kind: TestKind; level: Level; chapter?: number | null }): string => {
  if (kind === "grammar") return "/";
  const [path, param] = kind === "kanji" ? ["/kanji", "chapter"] : ["/reading", "group"];
  return `${path}?level=${level}${chapter ? `&${param}=${chapter}` : ""}`;
};

/**
 * A chapter's flashcards: the words not learned yet, of the lesson on `page` when given, or only `words`; the cards of
 * `seen` come last, and `review` is a random handful of the learned ones.
 *
 * @example
 * cardsOf("N2", 1, { words: ["n2-c1-渡航"] }); // -> "/kanji/N2/1/cards?words=n2-c1-%E6%B8%A1%E8%88%AA"
 * cardsOf("N2", 1, { page: 21 }); // -> "/kanji/N2/1/cards?page=21"
 */
export function cardsOf(
  level: Level,
  chapter: number,
  {
    words = [],
    page,
    seen = [],
    review = false,
  }: { words?: string[]; page?: number; seen?: string[]; review?: boolean } = {},
): string {
  const search = new URLSearchParams();
  if (words.length) search.set("words", words.join(","));
  if (page) search.set("page", String(page));
  if (seen.length) search.set("seen", seen.join(","));
  if (review) search.set("review", "1");
  const path = `/kanji/${level}/${chapter}/cards`;
  return search.size ? `${path}?${search}` : path;
}
