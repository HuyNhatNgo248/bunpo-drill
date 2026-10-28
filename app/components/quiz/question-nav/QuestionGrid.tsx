import { cn } from "~/lib/utils";
import { SECTION_TITLES } from "~/lib/sections";
import type { QuizSection } from "~/lib/views";
import { Legend } from "./Legend";

/** What every view of the question list needs. */
export type QuestionListProps = { sections: QuizSection[]; answered: Set<string> };

/** Question numbers grouped by section, filled red once answered. */
export function QuestionGrid({
  sections,
  answered,
  onPick,
  touch = false,
}: QuestionListProps & { onPick: (num: number) => void; touch?: boolean }) {
  return (
    <>
      {sections.map((section) => {
        const questions = section.groups.flatMap((group) => group.questions);
        return (
          <div key={section.no} className="flex flex-col gap-2">
            <div lang="ja" className="flex items-baseline gap-1.5 font-jp text-xs">
              <span className="font-bold">問題{section.no}</span>
              <span className="truncate text-muted-foreground">{SECTION_TITLES[section.type]}</span>
            </div>
            <ol
              className={cn(
                "grid gap-1.5",
                touch ? "grid-cols-numbers gap-2" : "grid-cols-5",
              )}
            >
              {questions.map((question) => {
                const done = answered.has(question.id);
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      onClick={() => onPick(question.num)}
                      aria-label={`問題${question.num}（${done ? "回答済み" : "未回答"}）`}
                      className={cn(
                        "flex w-full items-center justify-center rounded-md border font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        touch ? "h-11 text-sm" : "h-8 text-xs",
                        done
                          ? "border-indigo bg-indigo text-indigo-foreground hover:bg-indigo-hover"
                          : "border-border bg-card text-subtle-foreground hover:bg-muted",
                      )}
                    >
                      {question.num}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}

      <Legend />
    </>
  );
}
