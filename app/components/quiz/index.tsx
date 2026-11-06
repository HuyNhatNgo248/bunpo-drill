import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSubmit } from "react-router";
import { AddNote } from "~/components/add-note";
import { NotesProvider } from "~/components/noted-text";
import { PageTitle } from "~/components/PageTitle";
import { ProgressCard } from "~/components/ProgressCard";
import { ProgressHeader } from "~/components/ProgressHeader";
import { homeOf } from "~/lib/links";
import { clock, cn } from "~/lib/utils";
import type { Answers, NoteMark, QuizDraft, QuizView, ResultSection } from "~/lib/views";
import { CheckSummary } from "./CheckSummary";
import { quizProgress } from "./helpers/answers";
import { takeLocalDraft } from "./helpers/localDraft";
import { useAutosave } from "./hooks/useAutosave";
import { useReadingTimer } from "./hooks/useReadingTimer";
import { QuestionNav } from "./question-nav";
import { ANSWER_MARKS, answeredMarks } from "./question-nav/QuestionGrid";
import { Section } from "./Section";
import { SubmitBar } from "./SubmitBar";

/**
 * The quiz page. The answer sheet lives here, from the `draft` it was left at, and is saved on the server as it
 * changes until it is submitted. Each part can be checked on the way; the final submit still grades the whole test.
 * Words of the user's `notes` are highlighted. A `trial` test (/try/:id) is for visitors without an account, so its
 * sheet is not saved, and it has no notes.
 */
export function Quiz({
  quiz,
  draft,
  notes = [],
  error,
  trial = false,
}: {
  quiz: QuizView;
  draft: QuizDraft;
  notes?: NoteMark[];
  error?: string;
  trial?: boolean;
}) {
  const [answers, setAnswers] = useState(draft.answers);
  const [checks, setChecks] = useState(draft.checks);
  // A reading set times each passage; its times are kept by passage index, kept passages of a retake included.
  const passages = quiz.sections.flatMap((section) => section.groups.flatMap((group) => (group.reading ? [group.reading] : [])));
  const timer = useReadingTimer(Math.max(0, ...passages.map((passage) => passage.index + 1)), draft.times);
  useAutosave(trial ? null : quiz.id, { answers, checks, kept: draft.kept }, passages.length ? timer.ref : undefined);
  // A sheet this browser kept from before drafts were saved on the server goes on, unless the server has one.
  useEffect(() => {
    const local = takeLocalDraft(quiz.id);
    if (!local || Object.keys(draft.answers).length || Object.keys(draft.checks).length) return;
    setAnswers(local.answers);
    setChecks(local.checks);
  }, [quiz.id, draft]);
  // The part checked last, summed up in a dialog; a part reopened from the saved checks isn't.
  const [summary, setSummary] = useState<ResultSection>();
  const submit = useSubmit();
  const { answeredIds, answered, left, percent } = quizProgress(quiz, answers);

  // Stable, so a question card re-renders only when its own answer changes.
  const setAnswer = useCallback(
    (id: string, value: Answers[string]) => setAnswers((current) => ({ ...current, [id]: value })),
    [setAnswers],
  );
  const onChecked = useCallback(
    (section: ResultSection) => {
      setChecks((current) => ({ ...current, [section.no]: section }));
      setSummary(section);
    },
    [setChecks],
  );
  const send = () =>
    submit(passages.length ? { answers, times: timer.ref.current } : { answers }, { method: "post", encType: "application/json" });
  const { t } = useLingui();
  // A trial test leads back to the welcome page at /, as a grammar test does.
  const kind = trial ? "grammar" : quiz.kind;
  const back =
    kind === "kanji"
      ? { to: homeOf(quiz), label: t`Back to kanji` }
      : kind === "reading"
        ? { to: homeOf(quiz), label: t`Back to reading` }
        : undefined;
  const total = quiz.questionCount;
  const spent = passages.reduce((sum, passage) => sum + (timer.times[passage.index] ?? 0), 0);
  const target = passages.reduce((sum, passage) => sum + passage.targetSeconds, 0);
  const time = clock(spent);
  const goal = clock(target);
  const timeLabel = t`Time ${time}, target ${goal}`;

  return (
    <NotesProvider notes={notes}>
      <div className="min-h-screen">
        <ProgressHeader
          title={quiz.title}
          count={passages.length ? `${answered} / ${total} · ${time}` : `${answered} / ${total}`}
          percent={percent}
          label={t`Answered`}
          back={back}
        />

        <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 md:gap-5 md:px-6 md:pt-8 md:pb-12 lg:max-w-260">
          <PageTitle
            level={quiz.level}
            meta={<Plural value={total} one="# question" other="# questions" />}
            back={{
              to: homeOf({ ...quiz, kind }),
              label: kind === "kanji" ? <Trans>← Kanji</Trans> : kind === "reading" ? <Trans>← Reading</Trans> : <Trans>← Mock tests</Trans>,
            }}
          >
            {quiz.title}
          </PageTitle>
          <ProgressCard
            percent={percent}
            label={t`Answered`}
            aside={
              passages.length > 0 && (
                <span role="timer" aria-label={timeLabel} className="flex items-center gap-2.5 border-l pl-5">
                  <Timer aria-hidden="true" className="size-4.5 text-subtle-foreground" />
                  <span className="flex flex-col leading-tight">
                    <span className={cn("text-prompt font-semibold tabular-nums", spent > target && "text-warning")}>
                      {time} <span className="text-caption font-normal text-muted-foreground">/ {goal}</span>
                    </span>
                  </span>
                </span>
              )
            }
          >
            <Trans>
              Answered {answered} / {total}
            </Trans>
          </ProgressCard>

          <div className="flex flex-col gap-3.5 md:gap-5 lg:grid lg:grid-cols-quiz lg:items-start lg:gap-6">
            <QuestionNav
              sections={quiz.sections}
              markOf={answeredMarks(answeredIds)}
              marks={ANSWER_MARKS}
              className="hidden lg:sticky lg:top-24 lg:flex"
            />

            <div className="flex min-w-0 flex-col gap-3.5 md:gap-5">
              {quiz.sections.map((section) => (
                <Section
                  key={section.no}
                  checkAction={`${trial ? "/try" : "/tests"}/${quiz.id}/check`}
                  section={section}
                  answers={answers}
                  onAnswer={setAnswer}
                  checked={checks[section.no]}
                  onChecked={onChecked}
                  times={timer.times}
                />
              ))}

              <SubmitBar
                sections={quiz.sections}
                answered={answeredIds}
                left={left}
                error={error}
                onSubmit={send}
              />
            </div>
          </div>
        </main>

        {/* A part is checked once, so its number keys a fresh, open dialog. */}
        {summary && <CheckSummary key={summary.no} section={summary} />}
        {!trial && <AddNote testId={quiz.id} />}
      </div>
    </NotesProvider>
  );
}
