import { Link } from "react-router";
import { AppHeader } from "~/components/layout/header";
import { Button } from "~/components/ui/button";
import { ExamCountdown } from "./ExamCountdown";
import { ExamSections } from "./ExamSections";
import { Footer } from "./Footer";
import { SampleQuiz } from "./SampleQuiz";

/** The page a signed-out visitor sees at /: what the app does, a sample question to answer, sign-up, and the days to the next exam. */
export function Welcome({ exam }: { exam: { date: string; daysLeft: number } }) {
  return (
    // A column the height of the screen, so the footer sits at the bottom even when the page is short.
    <div className="flex min-h-screen flex-col">
      <AppHeader guest />
      <main lang="ja" className="mx-auto flex w-full max-w-260 flex-1 flex-col gap-14 px-4 pt-10 pb-16 md:px-6 lg:gap-20 lg:pt-20 lg:pb-24">
        <section className="grid items-center gap-10 lg:grid-cols-welcome lg:gap-16">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="flex items-center gap-2 font-jp text-caption font-medium text-indigo">
              <span className="rounded-full border border-indigo/25 bg-indigo/10 px-2.5 py-px font-semibold">JLPT N3・N2</span>
              文法の模擬試験
            </p>
            {/* Japanese has no spaces to break at, so each phrase stays whole and lines break between them. */}
            <h1 className="font-jp text-3xl leading-snug font-bold tracking-tight md:text-hero">
              <span className="inline-block">
                自分の<span className="text-primary">文法ノート</span>から、
              </span>
              <span className="inline-block">本番形式の</span>
              <span className="inline-block">模擬試験。</span>
            </h1>
            <p className="max-w-136 font-jp text-base leading-sentence text-subtle-foreground">
              勉強した文型だけで、本番と同じ3つの問題形式のテストを作ります。間違えた文型はそのまま復習リストに。
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button asChild size="lg">
                <Link to="/signup">アカウントを作成</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/signin">ログイン</Link>
              </Button>
            </div>
            <p className="font-jp text-xs text-muted-foreground">
              <span className="lg:hidden">下</span>
              <span className="hidden lg:inline">右</span>
              の問題は、実際のテストと同じ形式のサンプルです。
            </p>
          </div>
          <SampleQuiz />
        </section>
        <ExamSections />
        <ExamCountdown exam={exam} />
      </main>
      <Footer />
    </div>
  );
}
