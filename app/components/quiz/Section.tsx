import { Fragment } from "react";
import { SECTION_TITLES, sectionInstruction } from "~/lib/sections";
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
  const nums = section.groups.flatMap((group) => group.questions.map((q) => q.num));
  return (
    <section className="mt-2 flex flex-col gap-3 md:mt-3" aria-labelledby={`section-${section.no}`}>
      <div lang="ja" className="flex flex-col gap-1 font-jp md:gap-1.5">
        <div className="flex items-baseline gap-2 md:gap-2.5">
          <h2 id={`section-${section.no}`} className="text-base font-bold md:text-prompt">
            問題{section.no}
          </h2>
          <span className="text-xs text-muted-foreground md:text-caption">{SECTION_TITLES[section.type]}</span>
        </div>
        <p className="text-xs leading-sentence text-subtle-foreground md:text-caption">
          {sectionInstruction(section.type, nums)}
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
