import { Trans, useLingui } from "@lingui/react/macro";
import { Fragment } from "react";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import type { ResultSection } from "~/lib/views";
import { PassageReview } from "./PassageReview";
import { ReadingPassageReview } from "./ReadingPassageReview";
import { QuestionReview } from "./QuestionReview";

/** One 問題 graded: its title, its score, and each question (and passage) with the right answers. */
export function SectionReview({ section }: { section: ResultSection }) {
  const { i18n } = useLingui();
  const no = section.no;
  const gloss = sectionGloss(i18n, section.type);
  return (
    <section className="flex flex-col gap-2.5 md:gap-3" aria-labelledby={`review-${section.no}`}>
      <div className="mt-1 flex items-baseline gap-2 md:gap-2.5">
        <h3 id={`review-${section.no}`} className="text-body-sm font-bold md:text-base">
          <Trans>Part {no}</Trans>
        </h3>
        <span lang="ja" className="font-jp text-xs text-muted-foreground md:text-caption">
          {SECTION_TITLES[section.type]}
        </span>
        {gloss && <span className="text-xs text-muted-foreground md:text-caption">· {gloss}</span>}
        <span className="ml-auto text-xs text-muted-foreground md:text-caption">
          {section.correct} / {section.total}
        </span>
      </div>

      <ReviewGroups section={section} />
    </section>
  );
}

/**
 * A graded part's passages and questions. Each passage pins at the top while its own questions scroll by: below the
 * quiz's pinned header or progress bar when `inQuiz`. Each question card is its question's anchor and lands below both.
 */
export function ReviewGroups({ section, inQuiz = false }: { section: ResultSection; inQuiz?: boolean }) {
  const pin = inQuiz ? "top-16 md:top-24" : "top-4 md:top-6";
  const landBelowPassage = inQuiz
    ? "scroll-mt-passage md:scroll-mt-passage-desktop"
    : "scroll-mt-passage-results md:scroll-mt-passage-results-desktop";
  const land = inQuiz ? "scroll-mt-20 md:scroll-mt-24" : undefined;
  return section.groups.map((group, g) => {
    const passage = group.segments || group.reading;
    const cards = group.questions.map((question) => (
      <QuestionReview key={question.id} question={question} className={passage ? landBelowPassage : land} />
    ));
    if (!passage) return <Fragment key={g}>{cards}</Fragment>;
    // Its own box, so the passage only stays pinned while its own questions scroll by.
    return (
      <div key={g} className="flex flex-col gap-2.5 md:gap-3">
        {group.segments && <PassageReview segments={group.segments} className={pin} />}
        {group.reading && <ReadingPassageReview passage={group.reading} className={pin} />}
        {cards}
      </div>
    );
  });
}
