import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import type { SectionType } from "~/lib/payload";
import type { ResultSection } from "~/lib/views";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import { Legend } from "./Legend";

/** How a question's number shows: answered or not while the test is taken, right or wrong in the results. */
export type QuestionMark = "answered" | "unanswered" | "correct" | "wrong";

/** The sections of a quiz or of its results: both number their questions the same way. */
type NumberedSection = { no: number; type: SectionType; groups: { questions: { id: string; num: number }[] }[] };

/** What every view of the question list needs: the sections, how each question shows, and which marks the legend explains. */
export type QuestionListProps = { sections: NumberedSection[]; markOf: (id: string) => QuestionMark; marks: QuestionMark[] };

/** The marks of a quiz under way: a question is answered or not. */
export const ANSWER_MARKS: QuestionMark[] = ["answered", "unanswered"];
export const answeredMarks = (answered: Set<string>) => (id: string): QuestionMark => (answered.has(id) ? "answered" : "unanswered");

/** The marks of the results: a question is right or wrong, and one left blank is wrong. */
export const RESULT_MARKS: QuestionMark[] = ["correct", "wrong"];
export function gradedMarks(sections: ResultSection[]) {
  const right = new Set(sections.flatMap((s) => s.groups.flatMap((g) => g.questions.filter((q) => q.correct).map((q) => q.id))));
  return (id: string): QuestionMark => (right.has(id) ? "correct" : "wrong");
}

const MARK_STYLES: Record<QuestionMark, string> = {
  answered: "border-indigo bg-indigo text-indigo-foreground hover:bg-indigo-hover",
  unanswered: "border-border bg-card text-subtle-foreground hover:bg-muted",
  correct: "border-success-border bg-success-soft text-success hover:border-success",
  wrong: "border-primary-border bg-primary-soft text-primary-soft-foreground hover:border-primary",
};

/**
 * Question numbers grouped by section, each in the colour of its mark. The narrow list has room for one name per section,
 * so it takes the page's language: the English gloss, or the official Japanese name on a Japanese page.
 * The section headings show both.
 */
export function QuestionGrid({
  sections,
  markOf,
  marks,
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
                const mark = markOf(question.id);
                const num = question.num;
                const labels: Record<QuestionMark, string> = {
                  answered: t`Question ${num} (answered)`,
                  unanswered: t`Question ${num} (unanswered)`,
                  correct: t`Question ${num} (correct)`,
                  wrong: t`Question ${num} (wrong)`,
                };
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      onClick={() => onPick(question.num)}
                      aria-label={labels[mark]}
                      className={cn(
                        "flex w-full items-center justify-center rounded-md border font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        touch ? "h-11 text-sm" : "h-8 text-xs",
                        MARK_STYLES[mark],
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

      <Legend marks={marks} />
    </>
  );
}
