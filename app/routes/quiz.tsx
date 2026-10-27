import { cn } from "cn";
import { Fragment } from "react";
import { data, redirect, useNavigation, useSubmit } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/quiz";
import { AppHeader } from "~/components/app-header";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { QuestionNav, QuestionSheet } from "~/components/quiz/question-nav";
import { SentenceOrder, type Slots } from "~/components/quiz/sentence-order";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { RadioGroup, RadioGroupCard } from "~/components/ui/radio-group";
import { submittedAnswersSchema, toQuizView, toSubmission } from "~/lib/grading.server";
import { questionAnchor, SECTION_TITLES, sectionInstruction } from "~/lib/sections";
import { testNotFound } from "~/lib/errors";
import { useLiveAnswers } from "~/lib/live";
import { forgetLive } from "~/lib/live.server";
import { getTest, saveSubmission } from "~/lib/tests.server";
import type { Answers, QuizQuestion, QuizSection, QuizSegment, QuizView } from "~/lib/views";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData ? `${loaderData.quiz.title} · 文法ドリル` : "文法ドリル" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const test = await getTest(params.id);
  if (!test) throw testNotFound();
  return { quiz: toQuizView(test) };
}

export async function action({ request, params }: Route.ActionArgs) {
  const test = await getTest(params.id);
  if (!test) throw testNotFound();
  const body = z.object({ answers: submittedAnswersSchema }).safeParse(await request.json().catch(() => null));
  if (!body.success) return data({ error: "回答を読み取れませんでした。もう一度お試しください。" }, { status: 400 });
  await saveSubmission(test.id, toSubmission(test.payload, body.data.answers));
  forgetLive(test.id);
  return redirect(`/tests/${test.id}/results`);
}

export default function QuizRoute({ loaderData, actionData }: Route.ComponentProps) {
  // A new test id starts with a clean answer sheet.
  return <Quiz key={loaderData.quiz.id} quiz={loaderData.quiz} error={actionData?.error} />;
}

function Quiz({ quiz, error }: { quiz: QuizView; error?: string }) {
  const [answers, setAnswers] = useLiveAnswers(quiz.id);
  const submit = useSubmit();
  const submitting = useNavigation().state !== "idle";

  const questions = quiz.sections.flatMap((section) => section.groups.flatMap((group) => group.questions));
  const answeredIds = new Set(questions.filter((q) => isAnswered(q, answers)).map((q) => q.id));
  const answered = answeredIds.size;
  const left = quiz.questionCount - answered;
  const percent = Math.round((answered / quiz.questionCount) * 100);

  const setAnswer = (id: string, value: Answers[string]) => setAnswers((current) => ({ ...current, [id]: value }));
  const send = () => submit({ answers }, { method: "post", encType: "application/json" });

  const submitButton = (onClick?: () => void) => (
    <Button size="lg" disabled={submitting} onClick={onClick} className="font-semibold md:px-5 md:font-medium">
      {submitting ? "提出中…" : "提出する"}
    </Button>
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 md:static">
        <AppHeader
          back
          mobileTitle={quiz.title}
          mobileAside={
            <span className="pr-2 text-[13px] text-subtle-foreground">
              {answered} / {quiz.questionCount}
            </span>
          }
        />
        <Progress value={percent} minFill={1} aria-label="回答済み" className="rounded-none md:hidden" />
      </div>

      <main className="mx-auto flex max-w-[820px] flex-col gap-3.5 px-4 pt-4 md:gap-5 md:px-6 md:pt-8 md:pb-12 lg:max-w-[1040px]">
        <div className="hidden flex-col gap-2 md:flex">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <Badge>{quiz.level}</Badge>
            <span>{quiz.questionCount}問</span>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight">{quiz.title}</h1>
        </div>

        {/* h-18 at top-3 ends 84px down; the question list and passages stick at top-24 (96px), just below it. */}
        <Card className="sticky top-3 z-10 hidden h-18 flex-col justify-center gap-2.5 px-5 shadow-raised md:flex">
          <span className="text-[13px] font-medium">
            回答済み {answered} / {quiz.questionCount}
          </span>
          <Progress value={percent} minFill={1} aria-label="回答済み" className="h-2" />
        </Card>

        <div className="flex flex-col gap-3.5 md:gap-5 lg:grid lg:grid-cols-[208px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <QuestionNav
            sections={quiz.sections}
            answered={answeredIds}
            className="hidden lg:sticky lg:top-24 lg:flex"
          />

          <div className="flex min-w-0 flex-col gap-3.5 md:gap-5">
            {quiz.sections.map((section) => (
              <Section
                key={section.no}
                section={section}
                answers={answers}
                onAnswer={setAnswer}
              />
            ))}

            <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex flex-col gap-2 border-t bg-card px-4 pt-3 pb-5 md:bottom-4 md:mx-0 md:mt-0 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:rounded-xl md:border md:px-4 md:py-3.5 md:shadow-float">
              {error && (
                <span role="alert" className="w-full text-center text-[13px] text-primary-soft-foreground md:text-left md:text-sm">
                  {error}
                </span>
              )}
              <QuestionSheet sections={quiz.sections} answered={answeredIds} remaining={left} className="lg:hidden" />
              <span role="status" className="hidden text-sm text-subtle-foreground lg:inline">
                {left > 0 ? `未回答 ${left}問` : "すべて回答済み"}
              </span>
              <div className="grid grid-cols-[1fr_2fr] gap-2 md:flex">
                <Button variant="outline" size="lg" onClick={() => setAnswers({})} className="text-secondary-foreground">
                  <span className="md:hidden">クリア</span>
                  <span className="hidden md:inline">回答をクリア</span>
                </Button>
                {left > 0 ? (
                  <ConfirmDialog
                    title={`未回答が${left}問あります。提出しますか？`}
                    description="未回答の問題は不正解になります。"
                    confirmLabel="提出する"
                    cancelLabel="解答を続ける"
                    onConfirm={send}
                  >
                    {submitButton()}
                  </ConfirmDialog>
                ) : (
                  submitButton(send)
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function isAnswered(question: QuizQuestion, answers: Answers) {
  const answer = answers[question.id];
  return question.type === "sentence-order"
    ? Array.isArray(answer) && answer.every((piece) => piece !== null)
    : typeof answer === "number";
}

function Section({
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
          <h2 id={`section-${section.no}`} className="text-base font-bold md:text-[17px]">
            問題{section.no}
          </h2>
          <span className="text-xs text-muted-foreground md:text-[13px]">{SECTION_TITLES[section.type]}</span>
        </div>
        <p className="text-xs leading-[1.7] text-subtle-foreground md:text-[13px]">
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

/** Keeps --passage-h on the passage's box equal to the passage's height, for its questions' scroll margin. */
function trackPassageHeight(card: HTMLElement) {
  const box = card.parentElement!;
  const observer = new ResizeObserver(() => box.style.setProperty("--passage-h", `${card.offsetHeight}px`));
  observer.observe(card);
  return () => observer.disconnect();
}

/**
 * The passage text; each blank shows the answer picked for it so far.
 * It sticks below the header (mobile, 57px) or the progress bar (desktop, like the
 * question list) and scrolls inside itself when it is taller than about a third of the screen.
 */
function PassageCard({
  segments,
  questions,
  answers,
}: {
  segments: QuizSegment[];
  questions: QuizQuestion[];
  answers: Answers;
}) {
  return (
    <Card
      ref={trackPassageHeight}
      className="sticky top-16 z-10 mt-1 max-h-[35dvh] overflow-y-auto p-4 shadow-raised md:top-24 md:max-h-[40dvh] md:p-6"
    >
      <p lang="ja" className="font-jp text-base leading-[2.2] md:text-[17px]">
        {segments.map((segment, i) => {
          if (segment.kind === "text") return <span key={i}>{segment.text}</span>;
          const question = questions.find((q) => q.id === segment.questionId);
          const picked = answers[segment.questionId];
          const label =
            question && question.type === "passage" && typeof picked === "number" ? question.choices[picked] : null;
          return (
            <span
              key={i}
              className={cn(
                "mx-[3px] inline-block min-w-13 rounded-md border px-2 text-center text-sm leading-7 md:mx-1 md:min-w-16 md:px-2.5 md:text-[15px] md:leading-[30px]",
                label
                  ? "border-primary-border bg-primary-soft font-medium text-primary-soft-foreground"
                  : "border-dashed border-faint text-subtle-foreground",
              )}
            >
              （{segment.num}）{label}
            </span>
          );
        })}
      </p>
    </Card>
  );
}

function QuestionCard({
  question,
  answer,
  onAnswer,
}: {
  question: QuizQuestion;
  answer: Answers[string] | undefined;
  onAnswer: (value: Answers[string]) => void;
}) {
  return (
    <Card
      id={questionAnchor(question.num)}
      tabIndex={-1}
      className={cn(
        "flex flex-col gap-3 p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:gap-4 md:p-5",
        // A jump lands a passage question 12px below the pinned passage (top-16 / md:top-24).
        question.type === "passage"
          ? "scroll-mt-[calc(var(--passage-h)+4.75rem)] md:scroll-mt-[calc(var(--passage-h)+6.75rem)]"
          : "scroll-mt-20 md:scroll-mt-24",
      )}
    >
      <div className="flex items-center gap-2 md:gap-2.5">
        <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-lg bg-muted px-1.5 text-xs font-semibold text-secondary-foreground md:h-7 md:min-w-7 md:text-[13px]">
          {question.num}
        </span>
        {question.type === "passage" && (
          <span lang="ja" className="font-jp text-xs text-muted-foreground md:text-[13px]">
            文章中の（{question.num}）に入るもの
          </span>
        )}
      </div>

      {question.type === "fill-blank" && (
        <p lang="ja" className="font-jp text-lg leading-[1.7] md:text-xl">
          {question.prompt}
        </p>
      )}

      {question.type === "sentence-order" ? (
        <SentenceOrder
          question={question}
          slots={Array.isArray(answer) ? answer : undefined}
          onChange={(slots: Slots) => onAnswer(slots)}
        />
      ) : (
        <RadioGroup
          aria-label={`問題 ${question.num} の選択肢`}
          value={typeof answer === "number" ? String(answer) : ""}
          onValueChange={(value) => onAnswer(Number(value))}
          className="grid-cols-1 gap-2 md:grid-cols-2 md:gap-2.5"
        >
          {question.choices.map((choice, index) => (
            <RadioGroupCard key={index} value={String(index)}>
              <span className="text-[13px] text-muted-foreground">{index + 1}</span>
              <span lang="ja" className="font-jp text-base">
                {choice}
              </span>
            </RadioGroupCard>
          ))}
        </RadioGroup>
      )}
    </Card>
  );
}
