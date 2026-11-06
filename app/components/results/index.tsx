import { Trans, useLingui } from "@lingui/react/macro";
import { AddNote } from "~/components/add-note";
import { NotesProvider } from "~/components/noted-text";
import { AppHeader } from "~/components/layout/header";
import { QuoteFooter } from "~/components/layout/QuoteFooter";
import { PageTitle } from "~/components/PageTitle";
import { QuestionNav } from "~/components/quiz/question-nav";
import { gradedMarks, RESULT_MARKS } from "~/components/quiz/question-nav/QuestionGrid";
import { QuestionSheet } from "~/components/quiz/question-nav/QuestionSheet";
import { homeOf } from "~/lib/links";
import type { NoteMark, ResultsView } from "~/lib/views";
import { Actions } from "./Actions";
import { ReviewCard } from "./ReviewCard";
import { ScoreCard } from "./ScoreCard";
import { TimeCard } from "./TimeCard";
import { SectionReview } from "./section-review";

/**
 * The results page: the score, the grammar to review, every answer checked, and the way on. The question list
 * shows each number right or wrong and jumps to it: beside the answers on a desktop, in a sheet from a bar pinned
 * to the bottom on a phone or tablet, as in the quiz. A `trial` test's results are for a visitor without an account,
 * so they are not kept: nothing can be marked reviewed or noted, and the way on is sign-up. Words of the user's `notes`
 * are highlighted.
 */
export function Results({ results, notes = [], trial = false }: { results: ResultsView; notes?: NoteMark[]; trial?: boolean }) {
  const { t } = useLingui();
  const { score, total } = results;
  const wrong = total - score;
  const markOf = gradedMarks(results.sections);
  // A trial test leads back to the welcome page at /, as a grammar test does.
  const kind = trial ? "grammar" : results.kind;

  return (
    <NotesProvider notes={notes}>
      <div className="flex min-h-screen flex-col">
        <AppHeader
          guest={trial}
          mobileTitle={`${results.title} · ${t`Results`}`}
          back={
            kind === "kanji"
              ? { to: homeOf(results), label: t`Back to kanji` }
              : kind === "reading"
                ? { to: homeOf(results), label: t`Back to reading` }
                : undefined
          }
        />

        <main className="mx-auto flex w-full flex-1 max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16 lg:max-w-260">
          <PageTitle
            level={results.level}
            meta={results.title}
            back={{
              to: homeOf({ ...results, kind }),
              label: kind === "kanji" ? <Trans>← Kanji</Trans> : kind === "reading" ? <Trans>← Reading</Trans> : <Trans>← Mock tests</Trans>,
            }}
          >
            <Trans>Results</Trans>
          </PageTitle>
          <ScoreCard results={results} />
          {results.kind === "reading" && <TimeCard results={results} />}
          <ReviewCard results={results} trial={trial} />

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

          <Actions results={results} trial={trial} />

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
        <QuoteFooter />
        {!trial && <AddNote testId={results.id} />}
      </div>
    </NotesProvider>
  );
}
