import { Trans } from "@lingui/react/macro";
import { memo } from "react";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { questionAnchor } from "~/lib/sections";
import type { Answers, QuizQuestion } from "~/lib/views";
import { ChoiceList } from "./ChoiceList";
import { SentenceOrder } from "./sentence-order";

/**
 * One question: its number, its prompt, and the choices or the sentence-order slots.
 * Memoized with a stable `onAnswer`, so answering one question re-renders only its own card.
 */
export const QuestionCard = memo(function QuestionCard({
  question,
  answer,
  onAnswer,
}: {
  question: QuizQuestion;
  answer: Answers[string] | undefined;
  onAnswer: (id: string, value: Answers[string]) => void;
}) {
  const answerThis = (value: Answers[string]) => onAnswer(question.id, value);
  const num = question.num;
  return (
    <Card
      id={questionAnchor(question.num)}
      tabIndex={-1}
      className={cn(
        "flex flex-col gap-3 p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:gap-4 md:p-5",
        // A jump lands a passage question 12px below the pinned passage (top-16 / md:top-24).
        question.type === "passage"
          ? "scroll-mt-passage md:scroll-mt-passage-desktop"
          : "scroll-mt-20 md:scroll-mt-24",
      )}
    >
      <div className="flex items-center gap-2 md:gap-2.5">
        <span className="flex h-6.5 min-w-6.5 items-center justify-center rounded-lg bg-muted px-1.5 text-xs font-semibold text-secondary-foreground md:h-7 md:min-w-7 md:text-caption">
          {question.num}
        </span>
        {question.type === "passage" && (
          <span className="text-xs text-muted-foreground md:text-caption">
            <Trans>Blank （{num}） in the passage</Trans>
          </span>
        )}
      </div>

      {question.type === "fill-blank" && (
        <p lang="ja" className="font-jp text-lg leading-sentence md:text-xl">
          {question.prompt}
        </p>
      )}

      {question.type === "sentence-order" ? (
        <SentenceOrder question={question} slots={Array.isArray(answer) ? answer : undefined} onChange={answerThis} />
      ) : (
        <ChoiceList
          num={question.num}
          choices={question.choices}
          picked={typeof answer === "number" ? answer : null}
          onPick={answerThis}
        />
      )}
    </Card>
  );
});
