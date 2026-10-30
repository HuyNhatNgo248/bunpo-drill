import { useCallback } from "react";
import { useSubmit } from "react-router";
import type { Answers, QuizView } from "~/lib/views";
import { Header } from "./Header";
import { quizProgress } from "./helpers/answers";
import { useSavedAnswers } from "./hooks/useSavedAnswers";
import { ProgressCard } from "./ProgressCard";
import { QuestionNav } from "./question-nav";
import { Section } from "./Section";
import { SubmitBar } from "./SubmitBar";
import { Title } from "./Title";

/** The quiz page. The answer sheet lives here, saved in the browser, until it is submitted. */
export function Quiz({ quiz, error }: { quiz: QuizView; error?: string }) {
  const [answers, setAnswers] = useSavedAnswers(quiz.id);
  const submit = useSubmit();
  const { answeredIds, answered, left, percent } = quizProgress(quiz, answers);

  // Stable, so a question card re-renders only when its own answer changes.
  const setAnswer = useCallback(
    (id: string, value: Answers[string]) => setAnswers((current) => ({ ...current, [id]: value })),
    [setAnswers],
  );
  const send = () => submit({ answers }, { method: "post", encType: "application/json" });

  return (
    <div className="min-h-screen">
      <Header title={quiz.title} answered={answered} total={quiz.questionCount} percent={percent} />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 md:gap-5 md:px-6 md:pt-8 md:pb-12 lg:max-w-260">
        <Title quiz={quiz} />
        <ProgressCard answered={answered} total={quiz.questionCount} percent={percent} />

        <div className="flex flex-col gap-3.5 md:gap-5 lg:grid lg:grid-cols-quiz lg:items-start lg:gap-6">
          <QuestionNav sections={quiz.sections} answered={answeredIds} className="hidden lg:sticky lg:top-24 lg:flex" />

          <div className="flex min-w-0 flex-col gap-3.5 md:gap-5">
            {quiz.sections.map((section) => (
              <Section key={section.no} section={section} answers={answers} onAnswer={setAnswer} />
            ))}

            <SubmitBar
              sections={quiz.sections}
              answered={answeredIds}
              left={left}
              error={error}
              onClear={() => setAnswers({})}
              onSubmit={send}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
