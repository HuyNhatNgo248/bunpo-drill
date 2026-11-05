import type { ReviewTarget } from "~/components/grammar-chips/GrammarChip";
import type { ReviewChip, TestSummary } from "~/lib/views";

/** A pattern got wrong: its first place in the 文法ノート, and every test that got it wrong. */
export type ReviewItem = { chip: ReviewChip; targets: ReviewTarget[] };

const notebookOrder = (a: ReviewChip, b: ReviewChip) => a.week - b.week || a.day - b.day || a.number - b.number;

/**
 * The grammar of the wrong answers over `tests`, one item per pattern (a pattern of two weeks shows at its first), in the
 * order of the 文法ノート. An item is reviewed once every test that got it wrong has it marked.
 *
 * @example
 * reviewList([testA, testB]); // 〜ばかりか wrong in both -> [{ chip: { pattern: "〜ばかりか", … }, targets: [A, B] }]
 */
export function reviewList(tests: TestSummary[]): ReviewItem[] {
  const byPattern = new Map<string, ReviewItem>();
  for (const test of tests) {
    for (const chip of test.review) {
      const target = { testId: test.id, grammarId: chip.grammarId };
      const item = byPattern.get(chip.pattern);
      if (!item) {
        byPattern.set(chip.pattern, { chip, targets: [target] });
        continue;
      }
      const first = notebookOrder(chip, item.chip) < 0 ? chip : item.chip;
      item.chip = { ...first, reviewed: item.chip.reviewed && chip.reviewed };
      item.targets.push(target);
    }
  }
  return [...byPattern.values()].sort((a, b) => notebookOrder(a.chip, b.chip));
}
