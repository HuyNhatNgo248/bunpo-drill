import { Fragment } from "react";
import { SECTION_TITLES } from "~/lib/sections";
import type { ResultSection } from "~/lib/views";
import { PassageReview } from "./PassageReview";
import { QuestionReview } from "./QuestionReview";

/** One 問題 graded: its title, its score, and each question (and passage) with the right answers. */
export function SectionReview({ section }: { section: ResultSection }) {
  return (
    <section className="flex flex-col gap-2.5 md:gap-3" aria-labelledby={`review-${section.no}`}>
      <div className="mt-1 flex items-baseline gap-2 md:gap-2.5">
        <h3 id={`review-${section.no}`} lang="ja" className="font-jp text-body-sm font-bold md:text-base">
          問題{section.no}
        </h3>
        <span lang="ja" className="font-jp text-xs text-muted-foreground md:text-caption">
          {SECTION_TITLES[section.type]}
        </span>
        <span className="ml-auto text-xs text-muted-foreground md:text-caption">
          {section.correct} / {section.total}
        </span>
      </div>

      {section.groups.map((group, g) => (
        <Fragment key={g}>
          {group.segments && <PassageReview segments={group.segments} />}
          {group.questions.map((question) => (
            <QuestionReview key={question.id} question={question} />
          ))}
        </Fragment>
      ))}
    </section>
  );
}
