import { cn } from "cn";
import { jumpTo } from "./helpers/jumpTo";
import { QuestionGrid, type QuestionListProps } from "./QuestionGrid";

/** Desktop sidebar: the question list, sticky below the progress bar. */
export function QuestionNav({ sections, answered, className }: QuestionListProps & { className?: string }) {
  return (
    <nav
      aria-label="問題一覧"
      className={cn("flex max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4", className)}
    >
      <QuestionGrid sections={sections} answered={answered} onPick={jumpTo} />
    </nav>
  );
}
