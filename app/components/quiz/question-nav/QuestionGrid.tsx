import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import type { QuizSection } from "~/lib/views";
import { Legend } from "./Legend";

/** What every view of the question list needs. */
export type QuestionListProps = { sections: QuizSection[]; answered: Set<string> };

/**
 * Question numbers grouped by section, filled red once answered. The narrow list has room for one name per section,
 * so it takes the page's language: the English gloss, or the official Japanese name on a Japanese page.
 * The section headings show both.
 */
export function QuestionGrid({
  sections,
  answered,
  onPick,
  touch = false,
}: QuestionListProps & { onPick: (num: number) => void; touch?: boolean }) {
  const { t, i18n } = useLingui();
  return (
    <>
      {sections.map((section) => {
        const questions = section.groups.flatMap((group) => group.questions);
        const no = section.no;
        const gloss = sectionGloss(i18n, section.type);
        return (
          <div key={section.no} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1.5 text-xs">
              <span className="shrink-0 font-bold">
                <Trans>Part {no}</Trans>
              </span>
              <span lang={gloss ? undefined : "ja"} className={cn("truncate text-muted-foreground", !gloss && "font-jp")}>
                {gloss ?? SECTION_TITLES[section.type]}
              </span>
            </div>
            <ol
              className={cn(
                "grid gap-1.5",
                touch ? "grid-cols-numbers gap-2" : "grid-cols-5",
              )}
            >
              {questions.map((question) => {
                const done = answered.has(question.id);
                const num = question.num;
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      onClick={() => onPick(question.num)}
                      aria-label={done ? t`Question ${num} (answered)` : t`Question ${num} (unanswered)`}
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
