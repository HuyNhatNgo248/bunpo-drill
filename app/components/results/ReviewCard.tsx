import { GrammarChips } from "~/components/grammar-chips";
import { Card } from "~/components/ui/card";
import type { ResultsView } from "~/lib/views";

/** The grammar of the wrong answers, to review. */
export function ReviewCard({ results }: { results: ResultsView }) {
  return (
    <Card className="flex flex-col gap-3.5 p-4 md:gap-4 md:p-6">
      <h2 className="text-base font-semibold md:text-lg">復習におすすめの文法</h2>
      {results.review.length > 0 ? (
        <GrammarChips testId={results.id} chips={results.review} />
      ) : (
        <p className="text-subtle-foreground">復習する文法はありません。全問正解でした。</p>
      )}
    </Card>
  );
}
