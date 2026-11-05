import { useLingui } from "@lingui/react/macro";
import { GrammarChip } from "~/components/grammar-chips/GrammarChip";
import { Badge } from "~/components/ui/badge";
import type { ReviewItem } from "./helpers/reviewList";

/**
 * The grammar of a week's part of the 文法ノート that a test got wrong, as the chips of the results page: a tap shows
 * where it is in the note and marks it reviewed in every test that got it wrong. Reviewed ones stay, in green; the
 * count is of the ones left.
 */
export function WeekReview({ items }: { items: ReviewItem[] }) {
  const { t } = useLingui();
  const left = items.filter((item) => !item.chip.reviewed).length;
  return (
    <section aria-labelledby="tests-review" className="flex flex-col gap-2.5">
      <h3 id="tests-review" className="flex items-center gap-2 text-caption font-semibold text-subtle-foreground">
        {t`Grammar to review`} <Badge variant="count">{left}</Badge>
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <GrammarChip key={item.chip.pattern} chip={item.chip} targets={item.targets} />
        ))}
      </div>
    </section>
  );
}
