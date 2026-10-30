import { Trans, useLingui } from "@lingui/react/macro";
import { Fragment } from "react";
import { PassageReview } from "~/components/results/section-review/PassageReview";
import { QuestionReview } from "~/components/results/section-review/QuestionReview";
import { questionAnchor, SECTION_TITLES, sectionGloss, sectionInstruction } from "~/lib/sections";
import type { Answers, QuizSection, ResultSection } from "~/lib/views";
import { CheckSection } from "./CheckSection";
import { answersOf, isAnswered } from "./helpers/answers";
import { PassageCard } from "./PassageCard";
import { QuestionCard } from "./QuestionCard";

/**
 * One 問題: its title and instruction, then its questions (and passages) and the button that checks it.
 * Once `checked`, it shows its score and each question graded, as the results do, and its answers are locked.
 */
export function Section({
  testId,
  section,
  answers,
  onAnswer,
  checked,
  onChecked,
}: {
  testId: string;
  section: QuizSection;
  answers: Answers;
  onAnswer: (id: string, value: Answers[string]) => void;
  checked: ResultSection | undefined;
  onChecked: (section: ResultSection) => void;
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
          {checked && (
            <span className="ml-auto text-xs font-semibold text-secondary-foreground md:text-caption">
              {checked.correct} / {checked.total}
            </span>
          )}
        </div>
        <p className="text-xs leading-sentence text-subtle-foreground md:text-caption">
          {i18n._(sectionInstruction(section.type, nums))}
        </p>
      </div>

      {checked && <CheckedGroups section={checked} />}

      {!checked && section.groups.map((group, g) => {
        const cards = group.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            answer={answers[question.id]}
            onAnswer={onAnswer}
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

      {!checked && (
        <CheckSection
          testId={testId}
          no={section.no}
          answers={answersOf(section, answers)}
          unanswered={section.groups.flatMap((group) => group.questions).filter((q) => !isAnswered(q, answers)).length}
          onChecked={onChecked}
        />
      )}
    </section>
  );
}

/** A checked part's questions, graded. Each keeps its question's anchor, so the question list still jumps to it. */
function CheckedGroups({ section }: { section: ResultSection }) {
  return section.groups.map((group, g) => (
    <Fragment key={g}>
      {group.segments && <PassageReview segments={group.segments} />}
      {group.questions.map((question) => (
        <div
          key={question.id}
          id={questionAnchor(question.num)}
          tabIndex={-1}
          className="scroll-mt-20 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:scroll-mt-24"
        >
          <QuestionReview question={question} />
        </div>
      ))}
    </Fragment>
  ));
}
