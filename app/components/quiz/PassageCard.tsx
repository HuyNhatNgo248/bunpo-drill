import { cn } from "cn";
import { Card } from "~/components/ui/card";
import type { Answers, QuizQuestion, QuizSegment } from "~/lib/views";
import { trackPassageHeight } from "./helpers/passageHeight";

/**
 * The passage text; each blank shows the answer picked for it so far.
 * It sticks below the header (mobile, 57px) or the progress bar (desktop, like the
 * question list) and scrolls inside itself when it is taller than about a third of the screen.
 */
export function PassageCard({
  segments,
  questions,
  answers,
}: {
  segments: QuizSegment[];
  questions: QuizQuestion[];
  answers: Answers;
}) {
  return (
    <Card
      ref={trackPassageHeight}
      className="sticky top-16 z-10 mt-1 max-h-[35dvh] overflow-y-auto p-4 shadow-raised md:top-24 md:max-h-[40dvh] md:p-6"
    >
      <p lang="ja" className="font-jp text-base leading-[2.2] md:text-[17px]">
        {segments.map((segment, i) => {
          if (segment.kind === "text") return <span key={i}>{segment.text}</span>;
          const question = questions.find((q) => q.id === segment.questionId);
          const picked = answers[segment.questionId];
          const label =
            question && question.type === "passage" && typeof picked === "number" ? question.choices[picked] : null;
          return (
            <span
              key={i}
              className={cn(
                "mx-0.75 inline-block min-w-13 rounded-md border px-2 text-center text-sm leading-7 md:mx-1 md:min-w-16 md:px-2.5 md:text-[15px] md:leading-7.5",
                label
                  ? "border-primary-border bg-primary-soft font-medium text-primary-soft-foreground"
                  : "border-dashed border-faint text-subtle-foreground",
              )}
            >
              （{segment.num}）{label}
            </span>
          );
        })}
      </p>
    </Card>
  );
}
