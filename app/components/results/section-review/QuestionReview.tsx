import { Trans, useLingui } from "@lingui/react/macro";
import { useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { NotedText } from "~/components/noted-text";
import { ReadingRuns } from "~/components/reading-passage";
import { UnderlinedSentence } from "~/components/UnderlinedSentence";
import { questionAnchor, TRAP_LABELS } from "~/lib/sections";
import type { ResultQuestion, SentencePiece } from "~/lib/views";

/**
 * One graded question: the sentence with the right answer in place, the learner's answer when wrong, the answer and why.
 * A missed sentence-order question shows the sentence twice, in the learner's order (✗) and then the right one (✓).
 * It is the question's anchor, which the question list jumps to; `className` sets how far below the top it lands.
 */
export function QuestionReview({ question, className }: { question: ResultQuestion; className?: string }) {
  const { t, i18n } = useLingui();
  // Opened from a note's link to this question.
  const arrived = useLocation().hash === `#${questionAnchor(question.num)}`;
  const yours = question.yours;
  const answer = question.answer;
  return (
    <Card
      id={questionAnchor(question.num)}
      tabIndex={-1}
      className={cn(
        "flex scroll-mt-4 flex-col gap-2.5 p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:scroll-mt-6 md:gap-3 md:p-5",
        !question.correct && "border-primary-border bg-primary-soft",
        arrived && "animate-arrived motion-reduce:animate-none",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-6.5 items-center justify-center rounded-lg border bg-card text-xs font-semibold text-secondary-foreground md:size-7 md:text-caption">
          {question.num}
        </span>
        {/* A reading question says what it asked for, and on a miss which trap the choice picked set. */}
        {question.reading && (
          <>
            <Badge variant="outline" lang="ja" className="bg-card font-jp">
              {question.reading.kind}
            </Badge>
            {!question.correct && question.reading.trap && (
              <Badge variant="outline" className="bg-card">
                {i18n._(TRAP_LABELS[question.reading.trap])}
              </Badge>
            )}
          </>
        )}
      </div>

      {question.reading && (
        <p
          lang="ja"
          data-note-sentence={question.reading.prompt.map((run) => run.text).join("")}
          className="font-jp text-prompt leading-sentence md:text-lg"
        >
          <ReadingRuns runs={question.reading.prompt} />
        </p>
      )}

      {question.prompt && (
        <p
          lang="ja"
          data-note-sentence={`${question.prompt.before}（${question.prompt.fill}）${question.prompt.after}`}
          className="font-jp text-prompt leading-sentence md:text-lg"
        >
          <NotedText text={question.prompt.before} />（<NotedText text={question.prompt.fill} />）
          <NotedText text={question.prompt.after} />
        </p>
      )}

      {question.underlined && (
        <p
          lang="ja"
          data-note-sentence={question.underlined.before + question.underlined.word + question.underlined.after}
          className="font-jp text-prompt leading-sentence md:text-lg"
        >
          <UnderlinedSentence sentence={question.underlined} />
        </p>
      )}

      {question.sentence && (
        // Either order notes the right sentence.
        <div
          data-note-sentence={question.sentence.before + question.sentence.pieces.map((piece) => piece.text).join("") + question.sentence.after}
          className="flex flex-col gap-1.5 md:gap-2"
        >
          {!question.correct && question.sentence.yours && (
            <OrderedSentence sentence={question.sentence} pieces={question.sentence.yours} mark="wrong" />
          )}
          <OrderedSentence sentence={question.sentence} pieces={question.sentence.pieces} mark={question.correct ? undefined : "right"} />
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
        <p lang="en" data-note-sentence={question.explanation} className="text-caption leading-relaxed text-secondary-foreground md:text-sm">
          <NotedText text={question.explanation} />
        </p>
      )}
    </Card>
  );
}

/** A sentence-order sentence with `pieces` in its slots and the ★ one boxed; a `mark` puts ✗ (red) or ✓ (green) before it. */
function OrderedSentence({
  sentence,
  pieces,
  mark,
}: {
  sentence: { before: string; after: string };
  pieces: SentencePiece[];
  mark?: "wrong" | "right";
}) {
  const { t } = useLingui();
  const wrong = mark === "wrong";
  return (
    <div lang="ja" className="flex flex-wrap items-center gap-1 font-jp text-base leading-sentence md:gap-1.5 md:text-lg">
      {mark && (
        <span className={cn("mr-1 font-semibold", wrong ? "text-primary-soft-foreground" : "text-success")}>
          <span aria-hidden="true">{wrong ? "✗" : "✓"}</span>
          <span className="sr-only">{wrong ? t`Wrong` : t`Correct`}</span>
        </span>
      )}
      <span>
        <NotedText text={sentence.before} />
      </span>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={cn(
            "px-1.5 leading-7.5 md:px-2 md:leading-8",
            !piece.star
              ? "border-b-line border-faint"
              : wrong
                ? "rounded-md border border-primary-border bg-card font-semibold text-primary-soft-foreground"
                : "rounded-md border border-success-border bg-success-soft font-semibold text-success",
          )}
        >
          {piece.star && "★ "}
          <NotedText text={piece.text} />
        </span>
      ))}
      <span>
        <NotedText text={sentence.after} />
      </span>
    </div>
  );
}
