import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { UnderlinedSentence } from "~/components/UnderlinedSentence";
import { questionAnchor } from "~/lib/sections";
import type { ResultQuestion } from "~/lib/views";

/**
 * One graded question: the sentence with the right answer in place, the learner's answer when wrong, the answer and why.
 * It is the question's anchor, which the question list jumps to; `className` sets how far below the top it lands.
 */
export function QuestionReview({ question, className }: { question: ResultQuestion; className?: string }) {
  const { t } = useLingui();
  const yours = question.yours;
  const answer = question.answer;
  return (
    <Card
      id={questionAnchor(question.num)}
      tabIndex={-1}
      className={cn(
        "flex scroll-mt-4 flex-col gap-2.5 p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:scroll-mt-6 md:gap-3 md:p-5",
        !question.correct && "border-primary-border bg-primary-soft",
        className,
      )}
    >
      <span className="flex size-6.5 items-center justify-center rounded-lg border bg-card text-xs font-semibold text-secondary-foreground md:size-7 md:text-caption">
        {question.num}
      </span>

      {question.prompt && (
        <p lang="ja" className="font-jp text-prompt leading-sentence md:text-lg">
          {question.prompt.before}（{question.prompt.fill}）{question.prompt.after}
        </p>
      )}

      {question.underlined && (
        <p lang="ja" className="font-jp text-prompt leading-sentence md:text-lg">
          <UnderlinedSentence sentence={question.underlined} />
        </p>
      )}

      {question.sentence && (
        <div lang="ja" className="flex flex-wrap items-center gap-1 font-jp text-base leading-sentence md:gap-1.5 md:text-lg">
          <span>{question.sentence.before}</span>
          {question.sentence.pieces.map((piece, i) => (
            <span
              key={i}
              className={cn(
                "px-1.5 leading-7.5 md:px-2 md:leading-8",
                piece.star
                  ? "rounded-md border border-success-border bg-success-soft font-semibold text-success"
                  : "border-b-line border-faint",
              )}
            >
              {piece.star ? `★ ${piece.text}` : piece.text}
            </span>
          ))}
          <span>{question.sentence.after}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:gap-2">
        {!question.correct && (
          <span className="rounded-lg border border-primary-border bg-card px-2.5 py-1.5 font-jp text-primary-soft-foreground md:px-3">
            {yours ? (
              <s>
                <Trans>Your answer: {yours}</Trans>
              </s>
            ) : (
              t`Unanswered`
            )}
          </span>
        )}
        <span className="rounded-lg border border-success-border bg-card px-2.5 py-1.5 font-jp font-medium text-success md:px-3">
          <Trans>Answer: {answer}</Trans>
        </span>
      </div>

      {question.explanation && (
        <p lang="en" className="text-caption leading-relaxed text-secondary-foreground md:text-sm">
          {question.explanation}
        </p>
      )}
    </Card>
  );
}
