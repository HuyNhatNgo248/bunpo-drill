import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { useCallback } from "react";
import { useSubmit } from "react-router";
import { PageTitle } from "~/components/PageTitle";
import { ProgressCard } from "~/components/ProgressCard";
import { ProgressHeader } from "~/components/ProgressHeader";
import { homeOf } from "~/lib/links";
import type { Answers, QuizView, ResultSection } from "~/lib/views";
import { checkedAnswers, quizProgress } from "./helpers/answers";
import { useSavedAnswers, useSavedChecks } from "./hooks/useSavedAnswers";
import { QuestionNav } from "./question-nav";
import { ANSWER_MARKS, answeredMarks } from "./question-nav/QuestionGrid";
import { Section } from "./Section";
import { SubmitBar } from "./SubmitBar";

/**
 * The quiz page. The answer sheet lives here, saved in the browser, until it is submitted. Each part can be
 * checked on the way; the final submit still grades the whole test.
 */
export function Quiz({ quiz, error }: { quiz: QuizView; error?: string }) {
  const [answers, setAnswers] = useSavedAnswers(quiz.id);
  const [checks, setChecks] = useSavedChecks(quiz.id);
  const submit = useSubmit();
  const { answeredIds, answered, left, percent } = quizProgress(quiz, answers);

  // Stable, so a question card re-renders only when its own answer changes.
  const setAnswer = useCallback(
    (id: string, value: Answers[string]) => setAnswers((current) => ({ ...current, [id]: value })),
    [setAnswers],
  );
  const onChecked = useCallback(
    (section: ResultSection) => setChecks((current) => ({ ...current, [section.no]: section })),
    [setChecks],
  );
  const send = () => submit({ answers }, { method: "post", encType: "application/json" });
  const { t } = useLingui();
  const back = quiz.kind === "kanji" ? { to: homeOf(quiz), label: t`Back to kanji` } : undefined;
  const total = quiz.questionCount;

  return (
    <div className="min-h-screen">
      <ProgressHeader title={quiz.title} count={`${answered} / ${total}`} percent={percent} label={t`Answered`} back={back} />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 md:gap-5 md:px-6 md:pt-8 md:pb-12 lg:max-w-260">
        <PageTitle
          level={quiz.level}
          meta={<Plural value={total} one="# question" other="# questions" />}
          back={{ to: homeOf(quiz), label: quiz.kind === "kanji" ? <Trans>← Kanji</Trans> : <Trans>← Mock tests</Trans> }}
        >
          {quiz.title}
        </PageTitle>
        <ProgressCard percent={percent} label={t`Answered`}>
          <Trans>
            Answered {answered} / {total}
          </Trans>
        </ProgressCard>

        <div className="flex flex-col gap-3.5 md:gap-5 lg:grid lg:grid-cols-quiz lg:items-start lg:gap-6">
          <QuestionNav
            sections={quiz.sections}
            markOf={answeredMarks(answeredIds)}
            marks={ANSWER_MARKS}
            className="hidden lg:sticky lg:top-24 lg:flex"
          />

          <div className="flex min-w-0 flex-col gap-3.5 md:gap-5">
            {quiz.sections.map((section) => (
              <Section
                key={section.no}
                testId={quiz.id}
                section={section}
                answers={answers}
                onAnswer={setAnswer}
                checked={checks[section.no]}
                onChecked={onChecked}
              />
            ))}

            <SubmitBar
              sections={quiz.sections}
              answered={answeredIds}
              left={left}
              error={error}
              onClear={() => setAnswers((current) => checkedAnswers(quiz, checks, current))}
              onSubmit={send}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
