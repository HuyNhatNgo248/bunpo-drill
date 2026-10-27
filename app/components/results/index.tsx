import { AppHeader } from "~/components/layout/header";
import type { ResultsView } from "~/lib/views";
import { Actions } from "./Actions";
import { ReviewCard } from "./ReviewCard";
import { ScoreCard } from "./ScoreCard";
import { SectionReview } from "./section-review";
import { Title } from "./Title";

/** The results page: the score, the grammar to review, every answer checked, and the way on. */
export function Results({ results }: { results: ResultsView }) {
  return (
    <div className="min-h-screen">
      <AppHeader back mobileTitle={`${results.title} · 結果`} />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16">
        <Title results={results} />
        <ScoreCard results={results} />
        <ReviewCard results={results} />

        <h2 className="mt-1.5 text-base font-semibold md:mt-2 md:text-lg">解答の確認</h2>
        {results.sections.map((section) => (
          <SectionReview key={section.no} section={section} />
        ))}

        <Actions testId={results.id} />
      </main>
    </div>
  );
}
