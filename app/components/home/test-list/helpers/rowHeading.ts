/**
 * What a row's week tile and title say. A test of one week shows the week in the tile and drops its "第N週" from the
 * title; a test of several weeks shows them in the tile ("3・5", or "1–4" for more) and keeps its whole title.
 *
 * @example
 * rowHeading("第2週 1〜6日目", [2]); // -> { week: "2", title: "1〜6日目" }
 * rowHeading("苦手な文法", [1, 3, 4]); // -> { week: "1–4", title: "苦手な文法" }
 */
export function rowHeading(title: string, weeks: number[]): { week: string; title: string } {
  const [first, ...rest] = weeks;
  if (first === undefined) return { week: "", title };
  if (rest.length === 0) return { week: String(first), title: title.replace(`第${first}週`, "").trim() || title };
  return { week: rest.length === 1 ? `${first}・${rest[0]}` : `${first}–${rest.at(-1)}`, title };
}
