import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChoiceList } from "~/components/quiz/ChoiceList";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import { SAMPLES } from "./helpers/samples";

/**
 * Three 問題1 questions the visitor answers on the spot. A pick fills the blank and shows the
 * answer and why, with a 正解 seal when it is right; after the third comes the score and sign-up.
 */
export function SampleQuiz() {
  const { t, i18n } = useLingui();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const feedback = useRef<HTMLDivElement>(null);
  const done = index === SAMPLES.length;
  const sample = SAMPLES[Math.min(index, SAMPLES.length - 1)];
  const right = picked === sample.answer;
  const no = 1;
  const gloss = sectionGloss(i18n, "fill-blank");
  const total = SAMPLES.length;
  const n = sample.answer + 1;
  const choice = sample.choices[sample.answer];
  const pattern = sample.pattern;
  const why = i18n._(sample.why);

  // The choices go away once one is picked, so focus moves to what replaced them.
  useEffect(() => {
    if (picked !== null || done) feedback.current?.focus();
  }, [picked, done]);

  const pick = (choice: number) => {
    setPicked(choice);
    if (choice === sample.answer) setScore(score + 1);
  };
  const next = () => {
    setIndex(index + 1);
    setPicked(null);
  };
  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-body-sm font-bold">
          <Trans>Part {no}</Trans>
          <span className="ml-1.5 text-caption font-normal text-muted-foreground">
            <span lang="ja" className="font-jp">
              {SECTION_TITLES["fill-blank"]}
            </span>
            {gloss && ` · ${gloss}`}
          </span>
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{done ? t`Nice work` : `${index + 1} / ${SAMPLES.length}`}</span>
      </div>

      <Card className="relative flex flex-col gap-4 overflow-hidden p-4 shadow-float md:p-5">
        {done ? (
          <div ref={feedback} tabIndex={-1} className="flex flex-col items-start gap-3 outline-none">
            <p className="text-body-sm text-subtle-foreground">
              <Trans>
                <strong className="text-title text-foreground tabular-nums">{score}</strong> of {total} right.
              </Trans>
            </p>
            <p className="text-body-sm leading-sentence text-subtle-foreground">
              <Trans>From your own grammar notes, you can make 45-question tests.</Trans>
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button asChild>
                <Link to="/signup">
                  <Trans>Create account</Trans>
                </Link>
              </Button>
              <Button variant="outline" onClick={restart}>
                <Trans>Try again</Trans>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {picked !== null && right && <Seal />}
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-caption font-semibold text-secondary-foreground">
              {index + 1}
            </span>
            <p lang="ja" className="font-jp text-lg leading-sentence md:text-xl">
              {sample.before}（
              <span
                className={cn(
                  "inline-block min-w-[4.5em] border-b-line text-center",
                  picked === null ? "border-faint" : "border-primary font-medium text-primary-soft-foreground",
                )}
              >
                {picked === null ? "　" : sample.choices[picked]}
              </span>
              ）{sample.after}
            </p>

            {picked === null ? (
              <ChoiceList num={index + 1} choices={sample.choices} picked={null} onPick={pick} />
            ) : (
              <>
                <ol className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-2.5">
                  {sample.choices.map((choice, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-box border bg-card px-3.5 md:min-h-13",
                        i === sample.answer
                          ? "border-success-border bg-success-soft text-success"
                          : i === picked
                            ? "border-primary-border bg-primary-soft text-primary-soft-foreground"
                            : "opacity-55",
                      )}
                    >
                      <span className="text-caption">{i + 1}</span>
                      <span lang="ja" className="font-jp text-base">
                        {choice}
                      </span>
                      {i === sample.answer && <span className="sr-only">{t`(correct)`}</span>}
                      {i === picked && i !== sample.answer && <span className="sr-only">{t`(your answer)`}</span>}
                    </li>
                  ))}
                </ol>
                <div ref={feedback} tabIndex={-1} className="flex flex-col gap-1.5 border-t pt-3.5 outline-none">
                  <span className={cn("text-sm font-bold", right ? "text-success" : "text-primary-soft-foreground")}>
                    {right ? t`Correct!` : t`The answer is ${n} “${choice}”`}
                  </span>
                  <p className="text-sm leading-sentence text-subtle-foreground">
                    <Trans>
                      <b className="font-bold text-foreground">{pattern}</b>: {why}
                    </Trans>
                  </p>
                  <Button variant="outline" onClick={next} className="mt-1 self-end">
                    {index === SAMPLES.length - 1 ? t`See your score` : t`Next question`}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

/** The 正解 seal, pressed on like a hanko. It repeats the verdict, so screen readers skip it. */
function Seal() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-3.5 right-3.5 flex size-16 -rotate-12 animate-press items-center justify-center rounded-full border-2 border-primary font-jp text-prompt font-bold text-primary opacity-90 before:absolute before:inset-1 before:rounded-full before:border before:border-primary/60 motion-reduce:animate-none"
    >
      正解
    </span>
  );
}
