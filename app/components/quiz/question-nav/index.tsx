import { useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { jumpTo } from "./helpers/jumpTo";
import { QuestionGrid, type QuestionListProps } from "./QuestionGrid";

/** The question list in a card: the quiz's desktop sidebar, and the results' list of right and wrong answers. */
export function QuestionNav({ sections, markOf, marks, className }: QuestionListProps & { className?: string }) {
  const { t } = useLingui();
  return (
    <nav
      aria-label={t`Question list`}
      className={cn("flex max-h-sidebar flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4", className)}
    >
      <QuestionGrid sections={sections} markOf={markOf} marks={marks} onPick={jumpTo} />
    </nav>
  );
}
