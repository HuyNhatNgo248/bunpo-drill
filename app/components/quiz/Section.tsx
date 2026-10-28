import { Trans, useLingui } from "@lingui/react/macro";
import { Fragment } from "react";
import { SECTION_TITLES, sectionGloss, sectionInstruction } from "~/lib/sections";
import type { Answers, QuizSection } from "~/lib/views";
import { PassageCard } from "./PassageCard";
import { QuestionCard } from "./QuestionCard";

/** One 問題: its title and instruction, then its questions (and passages). */
export function Section({
  section,
  answers,
  onAnswer,
}: {
  section: QuizSection;
  answers: Answers;
  onAnswer: (id: string, value: Answers[string]) => void;
}) {
  const { i18n } = useLingui();
  const no = section.no;
  const gloss = sectionGloss(i18n, section.type);
  const nums = section.groups.flatMap((group) => group.questions.map((q) => q.num));
  return (
    <section className="mt-2 flex flex-col gap-3 md:mt-3" aria-labelledby={`section-${section.no}`}>
      <div className="flex flex-col gap-1 md:gap-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 md:gap-x-2.5">
          <h2 id={`section-${section.no}`} className="text-base font-bold md:text-prompt">
            <Trans>Part {no}</Trans>
          </h2>
          <span lang="ja" className="font-jp text-xs text-muted-foreground md:text-caption">
            {SECTION_TITLES[section.type]}
          </span>
          {gloss && <span className="text-xs text-muted-foreground md:text-caption">· {gloss}</span>}
        </div>
        <p className="text-xs leading-sentence text-subtle-foreground md:text-caption">
          {i18n._(sectionInstruction(section.type, nums))}
        </p>
      </div>

      {section.groups.map((group, g) => {
        const cards = group.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            answer={answers[question.id]}
            onAnswer={(value) => onAnswer(question.id, value)}
          />
        ));
        // Its own box, so the passage only stays pinned while its own questions scroll by.
        return group.segments ? (
          <div key={g} className="flex flex-col gap-3">
            <PassageCard segments={group.segments} questions={group.questions} answers={answers} />
            {cards}
          </div>
        ) : (
          <Fragment key={g}>{cards}</Fragment>
        );
      })}
    </section>
  );
}
