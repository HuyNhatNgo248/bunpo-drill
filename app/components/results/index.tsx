import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect } from "react";
import { AppHeader } from "~/components/layout/header";
import { PageTitle } from "~/components/PageTitle";
import { forgetAnswers } from "~/components/quiz/helpers/savedAnswers";
import { QuestionNav } from "~/components/quiz/question-nav";
import { gradedMarks, RESULT_MARKS } from "~/components/quiz/question-nav/QuestionGrid";
import { QuestionSheet } from "~/components/quiz/question-nav/QuestionSheet";
import { homeOf } from "~/lib/links";
import type { ResultsView } from "~/lib/views";
import { Actions } from "./Actions";
import { ReviewCard } from "./ReviewCard";
import { ScoreCard } from "./ScoreCard";
import { SectionReview } from "./section-review";

/**
 * The results page: the score, the grammar to review, every answer checked, and the way on. The question list
 * shows each number right or wrong and jumps to it: beside the answers on a desktop, in a sheet from a bar pinned
 * to the bottom on a phone or tablet, as in the quiz.
 */
export function Results({ results }: { results: ResultsView }) {
  const { t } = useLingui();
  const { score, total } = results;
  const wrong = total - score;
  const markOf = gradedMarks(results.sections);
  // The test is submitted, so its saved answer sheet is done with; a retake starts clean.
  useEffect(() => forgetAnswers(results.id), [results.id]);

  return (
    <div className="min-h-screen">
      <AppHeader
        mobileTitle={`${results.title} · ${t`Results`}`}
        back={results.kind === "kanji" ? { to: homeOf(results), label: t`Back to kanji` } : undefined}
      />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16 lg:max-w-260">
        <PageTitle level={results.level} meta={results.title}>
          <Trans>Results</Trans>
        </PageTitle>
        <ScoreCard results={results} />
        <ReviewCard results={results} />

        <h2 className="mt-1.5 text-base font-semibold md:mt-2 md:text-lg">
          <Trans>Check your answers</Trans>
        </h2>
        <div className="flex flex-col gap-3.5 md:gap-5 lg:grid lg:grid-cols-quiz lg:items-start lg:gap-6">
          <QuestionNav
            sections={results.sections}
            markOf={markOf}
            marks={RESULT_MARKS}
            className="hidden lg:sticky lg:top-6 lg:flex"
          />
          <div className="flex min-w-0 flex-col gap-3.5 md:gap-5">
            {results.sections.map((section) => (
              <SectionReview key={section.no} section={section} />
            ))}
          </div>
        </div>

        <Actions results={results} />

        {/* Phone and tablet: a solid bar on the bottom edge, its button across the whole width. */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-card px-4 pt-3 pb-5 md:-mx-6 md:px-6 lg:hidden">
          <QuestionSheet
            sections={results.sections}
            markOf={markOf}
            marks={RESULT_MARKS}
            status={wrong > 0 ? t`${wrong} wrong` : t`All correct`}
            summary={t`Correct ${score} / ${total}`}
            className="md:w-full"
          />
        </div>
      </main>
    </div>
  );
}
