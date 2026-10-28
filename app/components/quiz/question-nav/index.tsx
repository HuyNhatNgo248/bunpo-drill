import { useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { jumpTo } from "./helpers/jumpTo";
import { QuestionGrid, type QuestionListProps } from "./QuestionGrid";

/** Desktop sidebar: the question list, sticky below the progress bar. */
export function QuestionNav({ sections, answered, className }: QuestionListProps & { className?: string }) {
  const { t } = useLingui();
  return (
    <nav
      aria-label={t`Question list`}
      className={cn("flex max-h-sidebar flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4", className)}
    >
      <QuestionGrid sections={sections} answered={answered} onPick={jumpTo} />
    </nav>
  );
}
