import { Trans } from "@lingui/react/macro";
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
      <main className="mx-auto flex w-full max-w-260 flex-1 flex-col gap-14 px-4 pt-10 pb-16 md:px-6 lg:gap-20 lg:pt-20 lg:pb-24">
        <section className="grid items-center gap-10 lg:grid-cols-welcome lg:gap-16">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="flex items-center gap-2 text-caption font-medium text-indigo">
              <span className="rounded-full border border-indigo/25 bg-indigo/10 px-2.5 py-px font-semibold">JLPT N3・N2</span>
              <Trans>Grammar mock tests</Trans>
            </p>
            {/* Japanese has no spaces to break at, so each phrase stays whole and lines break between them. */}
            <h1 className="text-3xl leading-snug font-bold tracking-tight md:text-hero">
              <Trans>
                <span className="inline-block">Real-format mock tests,</span>{" "}
                <span className="inline-block">
                  from <span className="text-primary">your own grammar notes</span>.
                </span>
              </Trans>
            </h1>
            <p className="max-w-136 text-base leading-sentence text-subtle-foreground">
              <Trans>
                Tests use only the patterns you have studied, in the same three formats as the real exam. The patterns you get
                wrong go straight to a review list.
              </Trans>
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button asChild size="lg">
                <Link to="/signup">
                  <Trans>Create account</Trans>
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/signin">
                  <Trans>Sign in</Trans>
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="lg:hidden">
                <Trans>The questions below are samples in the real test's format.</Trans>
              </span>
              <span className="hidden lg:inline">
                <Trans>The questions on the right are samples in the real test's format.</Trans>
              </span>
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
