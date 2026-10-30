import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect } from "react";
import { AppHeader } from "~/components/layout/header";
import { forgetAnswers } from "~/components/quiz/helpers/savedAnswers";
import { QuestionNav } from "~/components/quiz/question-nav";
import { gradedMarks, RESULT_MARKS } from "~/components/quiz/question-nav/QuestionGrid";
import type { ResultsView } from "~/lib/views";
import { Actions } from "./Actions";
import { ReviewCard } from "./ReviewCard";
import { ScoreCard } from "./ScoreCard";
import { SectionReview } from "./section-review";
import { Title } from "./Title";

/**
 * The results page: the score, the grammar to review, every answer checked, and the way on. The question list
 * shows each number right or wrong and jumps to it: beside the answers on a desktop, above them on a phone.
 */
export function Results({ results }: { results: ResultsView }) {
  const { t } = useLingui();
  // The test is submitted, so its saved answer sheet is done with; a retake starts clean.
  useEffect(() => forgetAnswers(results.id), [results.id]);

  return (
    <div className="min-h-screen">
      <AppHeader mobileTitle={`${results.title} · ${t`Results`}`} />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16 lg:max-w-260">
        <Title results={results} />
        <ScoreCard results={results} />
        <ReviewCard results={results} />

        <h2 className="mt-1.5 text-base font-semibold md:mt-2 md:text-lg">
          <Trans>Check your answers</Trans>
        </h2>
        <div className="flex flex-col gap-3.5 md:gap-5 lg:grid lg:grid-cols-quiz lg:items-start lg:gap-6">
          <QuestionNav
            sections={results.sections}
            markOf={gradedMarks(results.sections)}
            marks={RESULT_MARKS}
            className="lg:sticky lg:top-6"
          />
          <div className="flex min-w-0 flex-col gap-3.5 md:gap-5">
            {results.sections.map((section) => (
              <SectionReview key={section.no} section={section} />
            ))}
          </div>
        </div>

        <Actions testId={results.id} />
      </main>
    </div>
  );
}
