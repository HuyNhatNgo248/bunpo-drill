import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { GrammarChip } from "~/components/grammar-chips/GrammarChip";
import { Badge } from "~/components/ui/badge";
import type { ReviewItem } from "./helpers/reviewList";

/**
 * The grammar of a week's part of the 文法ノート that a test got wrong, as the chips of the results page: a tap shows
 * where it is in the note and marks it reviewed in every test that got it wrong. The ones left come first; reviewed ones
 * stay after them, in green. A chip marked now turns green where it is, and moves to the end only when the page is shown again
 * (the parent keys this by week, so another week sorts afresh). The count is of the ones left, out of all.
 */
export function WeekReview({ items }: { items: ReviewItem[] }) {
  const { t } = useLingui();
  const left = items.filter((item) => !item.chip.reviewed).length;
  const total = items.length;
  // The ones reviewed when the page was shown: only they go after the others, so a chip marked now stays where it is.
  const [reviewedAtStart] = useState(() => new Set(items.filter((item) => item.chip.reviewed).map((item) => item.chip.pattern)));
  // A stable sort, so each part keeps the order of the 文法ノート.
  const shown = [...items].sort((a, b) => Number(reviewedAtStart.has(a.chip.pattern)) - Number(reviewedAtStart.has(b.chip.pattern)));
  return (
    <section aria-labelledby="tests-review" className="flex flex-col gap-2.5">
      <h3 id="tests-review" className="flex items-center gap-2 text-caption font-semibold text-subtle-foreground">
        {t`Grammar to review`} <Badge variant="count">{t`${left} / ${total} left`}</Badge>
      </h3>
      <div className="flex flex-wrap gap-2">
        {shown.map((item) => (
          <GrammarChip key={item.chip.pattern} chip={item.chip} targets={item.targets} />
        ))}
      </div>
    </section>
  );
}
