import { cn } from "cn";
import { Fragment } from "react";
import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/results";
import { AppHeader } from "~/components/app-header";
import { GrammarChips } from "~/components/grammar-chips";
import { QuestionNotes } from "~/components/question-notes";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { requireUserId } from "~/lib/auth.server";
import { testNotFound } from "~/lib/errors";
import { toResultsView } from "~/lib/grading.server";
import { useLiveNotes } from "~/lib/live";
import { PASS_PERCENT, SECTION_TITLES } from "~/lib/sections";
import { getTest, listNotes } from "~/lib/tests.server";
import type { Note, ResultQuestion, ResultSection, ResultSegment } from "~/lib/views";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData ? `結果 · ${loaderData.results.title} · 文法ドリル` : "文法ドリル" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const [test, notes, userId] = await Promise.all([getTest(params.id), listNotes(params.id), requireUserId(request)]);
  if (!test) throw testNotFound();
  if (!test.submission) throw redirect(`/tests/${test.id}`);
  return { results: toResultsView(test, test.submission), notes, userId };
}

/** What each question card needs to show and add notes. */
type NotesProps = { testId: string; notes: Record<string, Note[]>; userId: number };

export default function Results({ loaderData }: Route.ComponentProps) {
  const { results, notes, userId } = loaderData;
  useLiveNotes(results.id);
  const wrong = results.total - results.score;
  const passed = results.percent >= PASS_PERCENT;

  return (
    <div className="min-h-screen">
      <AppHeader back mobileTitle={`${results.title} · 結果`} />

      <main className="mx-auto flex max-w-[820px] flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16">
        <div className="hidden flex-col gap-2 md:flex">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <Badge>{results.level}</Badge>
            <span>{results.title}</span>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight">結果</h1>
        </div>

        <Card className="flex flex-col gap-3.5 p-4 md:gap-1.5 md:p-6">
          <div className="hidden text-[13px] text-muted-foreground md:block">得点</div>
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2 md:gap-2.5">
              <span className="text-4xl font-bold tracking-tighter md:text-[44px]">
                {results.score} / {results.total}
              </span>
              <span className={cn("text-base font-semibold md:text-lg", passed ? "text-success" : "text-warning")}>
                {results.percent}%
              </span>
            </div>
            <span className="text-[13px] text-muted-foreground md:hidden">不正解 {wrong}問</span>
          </div>
          <Progress value={results.percent} aria-label="得点" className="h-2" />
          <div className="hidden text-[13px] text-muted-foreground md:block">
            不正解 {wrong}問 · 合格ライン {PASS_PERCENT}%
          </div>
        </Card>

        <Card className="flex flex-col gap-3.5 p-4 md:gap-4 md:p-6">
          <h2 className="text-base font-semibold md:text-lg">復習におすすめの文法</h2>
          {results.review.length > 0 ? (
            <GrammarChips testId={results.id} chips={results.review} />
          ) : (
            <p className="text-subtle-foreground">復習する文法はありません。全問正解でした。</p>
          )}
        </Card>

        <h2 className="mt-1.5 text-base font-semibold md:mt-2 md:text-lg">解答の確認</h2>

        {results.sections.map((section) => (
          <SectionReview key={section.no} section={section} notes={{ testId: results.id, notes, userId }} />
        ))}

        <div className="mt-1 grid grid-cols-2 gap-2 md:mt-0 md:flex md:justify-end">
          <Button asChild variant="outline" size="lg">
            <Link to="/">
              <span className="md:hidden">テスト一覧</span>
              <span className="hidden md:inline">テスト一覧に戻る</span>
            </Link>
          </Button>
          {/* Retake clears this result and the review chips, then opens the quiz. */}
          <Form method="post" action={`/tests/${results.id}/retake`} className="contents">
            <Button type="submit" size="lg" className="font-semibold md:px-5 md:font-medium">
              もう一度受ける
            </Button>
          </Form>
        </div>
      </main>
    </div>
  );
}

function SectionReview({ section, notes }: { section: ResultSection; notes: NotesProps }) {
  return (
    <section className="flex flex-col gap-2.5 md:gap-3" aria-labelledby={`review-${section.no}`}>
      <div className="mt-1 flex items-baseline gap-2 md:gap-2.5">
        <h3 id={`review-${section.no}`} lang="ja" className="font-jp text-[15px] font-bold md:text-base">
          問題{section.no}
        </h3>
        <span lang="ja" className="font-jp text-xs text-muted-foreground md:text-[13px]">
          {SECTION_TITLES[section.type]}
        </span>
        <span className="ml-auto text-xs text-muted-foreground md:text-[13px]">
          {section.correct} / {section.total}
        </span>
      </div>

      {section.groups.map((group, g) => (
        <Fragment key={g}>
          {group.segments && <PassageReview segments={group.segments} />}
          {group.questions.map((question) => (
            <QuestionReview key={question.id} question={question} notes={notes} />
          ))}
        </Fragment>
      ))}
    </section>
  );
}

/** The passage with every blank filled in: green if answered right, red if not. */
function PassageReview({ segments }: { segments: ResultSegment[] }) {
  return (
    <Card className="mt-1 p-4 md:p-5">
      <p lang="ja" className="font-jp text-base leading-[2.2] md:text-[17px]">
        {segments.map((segment, i) =>
          segment.kind === "text" ? (
            <span key={i}>{segment.text}</span>
          ) : (
            <span
              key={i}
              className={cn(
                "mx-[3px] inline-block rounded-md border px-2 text-sm leading-7 font-medium md:mx-1 md:px-2.5 md:text-[15px] md:leading-[30px]",
                segment.correct
                  ? "border-success-border bg-success-soft text-success"
                  : "border-primary-border bg-primary-soft text-primary-soft-foreground",
              )}
            >
              （{segment.num}）{segment.fill}
            </span>
          ),
        )}
      </p>
    </Card>
  );
}

function QuestionReview({ question, notes }: { question: ResultQuestion; notes: NotesProps }) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-2.5 p-4 md:gap-3 md:p-5",
        !question.correct && "border-primary-border bg-primary-soft",
      )}
    >
      <span className="flex size-[26px] items-center justify-center rounded-lg border bg-card text-xs font-semibold text-secondary-foreground md:size-7 md:text-[13px]">
        {question.num}
      </span>

      {question.prompt && (
        <p lang="ja" className="font-jp text-[17px] leading-[1.7] md:text-lg">
          {question.prompt.before}（{question.prompt.fill}）{question.prompt.after}
        </p>
      )}

      {question.sentence && (
        <div lang="ja" className="flex flex-wrap items-center gap-1 font-jp text-base leading-[1.7] md:gap-1.5 md:text-lg">
          <span>{question.sentence.before}</span>
          {question.sentence.pieces.map((piece, i) => (
            <span
              key={i}
              className={cn(
                "px-1.5 leading-[30px] md:px-2 md:leading-8",
                piece.star
                  ? "rounded-md border border-success-border bg-success-soft font-semibold text-success"
                  : "border-b-[1.5px] border-faint",
              )}
            >
              {piece.star ? `★ ${piece.text}` : piece.text}
            </span>
          ))}
          <span>{question.sentence.after}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:gap-2">
        {!question.correct && (
          <span className="rounded-lg border border-primary-border bg-card px-2.5 py-1.5 font-jp text-primary-soft-foreground md:px-3">
            {question.yours ? <s>あなたの解答：{question.yours}</s> : "未回答"}
          </span>
        )}
        <span className="rounded-lg border border-success-border bg-card px-2.5 py-1.5 font-jp font-medium text-success md:px-3">
          正解：{question.answer}
        </span>
      </div>

      <QuestionNotes
        testId={notes.testId}
        questionId={question.id}
        notes={notes.notes[question.id] ?? []}
        userId={notes.userId}
      />
    </Card>
  );
}
