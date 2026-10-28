import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import type { ResultQuestion } from "~/lib/views";

/** One graded question: the sentence with the right answer in place, the learner's answer when wrong, and the answer. */
export function QuestionReview({ question }: { question: ResultQuestion }) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-2.5 p-4 md:gap-3 md:p-5",
        !question.correct && "border-primary-border bg-primary-soft",
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
            {question.yours ? <s>あなたの解答：{question.yours}</s> : "未回答"}
          </span>
        )}
        <span className="rounded-lg border border-success-border bg-card px-2.5 py-1.5 font-jp font-medium text-success md:px-3">
          正解：{question.answer}
        </span>
      </div>
    </Card>
  );
}
