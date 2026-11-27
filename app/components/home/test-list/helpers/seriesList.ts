import type { TestSummary } from "~/lib/views";

/** Tests named alike but for a number at the end ("第1〜8週 総合 1" … "第1〜8週 総合 20"), by that number. */
export type Series = { name: string; tests: { test: TestSummary; number: number }[] };

// "第1〜8週 総合 12" -> 第1〜8週 総合, 12; "第1〜8週 まとめ 3/10" -> 第1〜8週 まとめ, 3.
const NUMBERED = /^(.+?)\s+(\d+)(?:\/\d+)?$/;

/**
 * `tests` as series (two tests or more named alike but for their number), in the order of their first test, and the rest
 * in the order sent.
 *
 * @example
 * seriesList([総合 2, 第1〜4週, 総合 1]); // -> { series: [{ name: "第1〜8週 総合", tests: [1, 2] }], rest: [第1〜4週] }
 */
export function seriesList(tests: TestSummary[]): { series: Series[]; rest: TestSummary[] } {
  const byName = new Map<string, Series>();
  for (const test of tests) {
    const match = NUMBERED.exec(test.title);
    if (!match) continue;
    const [, name, number] = match;
    if (!byName.has(name)) byName.set(name, { name, tests: [] });
    byName.get(name)!.tests.push({ test, number: Number(number) });
  }
  const series = [...byName.values()].filter((one) => one.tests.length > 1);
  for (const one of series) one.tests.sort((a, b) => a.number - b.number);
  const inSeries = new Set(series.flatMap((one) => one.tests.map(({ test }) => test.id)));
  return { series, rest: tests.filter((test) => !inSeries.has(test.id)) };
}
