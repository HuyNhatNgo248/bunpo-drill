import { useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import type { QuestionMark } from "./QuestionGrid";

const SWATCHES: Record<QuestionMark, string> = {
  answered: "bg-indigo",
  unanswered: "border border-border bg-card",
  correct: "border border-success-border bg-success-soft",
  wrong: "border border-primary-border bg-primary-soft",
};

/** What the colours of the question numbers mean. Screen readers hear it in each button's label instead. */
export function Legend({ marks }: { marks: QuestionMark[] }) {
  const { t } = useLingui();
  const names: Record<QuestionMark, string> = { answered: t`Answered`, unanswered: t`Unanswered`, correct: t`Correct`, wrong: t`Wrong` };
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
      {marks.map((mark) => (
        <span key={mark} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-sm", SWATCHES[mark])} />
          {names[mark]}
        </span>
      ))}
    </div>
  );
}
