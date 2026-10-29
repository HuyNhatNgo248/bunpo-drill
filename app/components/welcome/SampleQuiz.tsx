import { Trans, useLingui } from "@lingui/react/macro";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router";
import { ChoiceList } from "~/components/quiz/ChoiceList";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import { cn } from "~/lib/utils";
import { SAMPLES } from "./helpers/samples";

const MotionCard = motion.create(Card);

/** The cards in the deck: one per question, then the score. */
const DECK = SAMPLES.length + 1;

/**
 * Where a card lies by its place in the pile: the front one straight, the next two tilted opposite ways and peeking out at the sides,
 * the rest hidden right behind the front one. Each is moved down by about the corner a tilt raises, so no corner pokes out at the top.
 */
const POSES = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 10, y: 8, rotate: 4, scale: 0.96 },
  { x: -10, y: 10, rotate: -5, scale: 0.95 },
  { x: 0, y: 0, rotate: 0, scale: 0.94 },
];

/**
 * Three 問題1 questions the visitor answers on the spot, as a deck of cards. A pick shows the answer and why in place of
 * the choices (with a 正解 seal when it is right); the next card is shuffled to the front, and the last one gives the score and sign-up.
 */
export function SampleQuiz() {
  const { t, i18n } = useLingui();
  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => SAMPLES.map(() => null));
  const [turns, setTurns] = useState(0);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const feedbacks = useRef<(HTMLDivElement | null)[]>([]);
  const score = picks.filter((picked, i) => picked === SAMPLES[i].answer).length;
  const no = 1;
  const gloss = sectionGloss(i18n, "fill-blank");

  // The choices and the card that held focus go out of reach, so focus moves to what replaced them.
  const pick = (i: number, choice: number) => {
    flushSync(() => setPicks(picks.map((picked, k) => (k === i ? choice : picked))));
    feedbacks.current[i]?.focus();
  };
  const moveTo = (card: number) => {
    flushSync(() => {
      if (card === 0) setPicks(SAMPLES.map(() => null));
      setCurrent(card);
      setTurns(turns + 1);
    });
    cards.current[card]?.focus();
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
        <span className="text-xs text-muted-foreground tabular-nums">
          {current === SAMPLES.length ? t`Nice work` : `${current + 1} / ${SAMPLES.length}`}
        </span>
      </div>

      {/* The front card sets the height; the others sit behind it, their tilted edges showing around it. */}
      <div className="relative pb-5">
        {Array.from({ length: DECK }, (_, k) => {
          const place = (k - current + DECK) % DECK;
          const front = place === 0;
          // The card that was just in front goes out to the side and tucks in at the back.
          const leaving = turns > 0 && place === DECK - 1;
          const pose = POSES[Math.min(place, POSES.length - 1)];
          return (
            <MotionCard
              key={k}
              ref={(el: HTMLElement | null) => {
                cards.current[k] = el;
              }}
              tabIndex={-1}
              role="group"
              aria-label={t`Sample question`}
              aria-hidden={!front || undefined}
              inert={!front}
              initial={false}
              animate={
                leaving
                  ? {
                      x: [0, "70%", pose.x],
                      y: [0, -8, pose.y],
                      rotate: [0, 8, pose.rotate],
                      scale: [1, 0.97, pose.scale],
                      zIndex: [DECK + 1, DECK + 1, 1],
                    }
                  : { ...pose, zIndex: DECK - place }
              }
              transition={
                leaving
                  ? { duration: 0.7, times: [0, 0.45, 1], ease: "easeInOut" }
                  : { duration: 0.35, ease: "easeOut", delay: turns > 0 ? 0.2 : 0 }
              }
              className={cn(
                "flex flex-col gap-4 overflow-hidden p-4 shadow-float outline-none md:p-5",
                front ? "relative" : "absolute inset-x-0 top-0 bottom-5",
                // Cards behind show a blank edge. The one leaving keeps its face until it has tucked in.
                !front && "*:invisible *:transition-[visibility] *:delay-[550ms]",
              )}
            >
              {k < SAMPLES.length ? (
                <Question
                  i={k}
                  picked={picks[k]}
                  onPick={(choice) => pick(k, choice)}
                  onNext={() => moveTo(k + 1)}
                  feedbackRef={(el) => {
                    feedbacks.current[k] = el;
                  }}
                />
              ) : (
                <Score score={score} onRestart={() => moveTo(0)} />
              )}
            </MotionCard>
          );
        })}
      </div>
    </div>
  );
}

/** A question card. Once picked, the answer and why take the place of the choices, in the same space, so nothing moves. */
function Question({
  i,
  picked,
  onPick,
  onNext,
  feedbackRef,
}: {
  i: number;
  picked: number | null;
  onPick: (choice: number) => void;
  onNext: () => void;
  feedbackRef: (el: HTMLDivElement | null) => void;
}) {
  const { t, i18n } = useLingui();
  const sample = SAMPLES[i];
  const answered = picked !== null;
  // Before a pick, the hidden answer is laid out with a wrong pick (the longer verdict), so its space is already kept.
  const right = (picked ?? (sample.answer + 1) % 4) === sample.answer;
  const n = sample.answer + 1;
  const choice = sample.choices[sample.answer];
  const pattern = sample.pattern;
  const why = i18n._(sample.why);

  return (
    <>
      <div className="flex items-start gap-3">
        {/* Moved down to sit on the sentence's first line. */}
        <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-caption font-semibold text-secondary-foreground md:mt-1.5">
          {i + 1}
        </span>
        <p lang="ja" className="font-jp text-lg leading-sentence md:text-xl">
          {sample.before}（
          <span
            className={cn(
              "inline-block min-w-[4.5em] border-b-line text-center",
              answered ? "border-primary font-medium text-primary-soft-foreground" : "border-faint",
            )}
          >
            {answered ? sample.choices[picked] : "　"}
          </span>
          ）{sample.after}
        </p>
      </div>

      <div className="grid">
        <div aria-hidden={answered || undefined} inert={answered} className={cn("[grid-area:1/1]", answered && "invisible")}>
          <ChoiceList num={i + 1} choices={sample.choices} picked={null} onPick={onPick} />
        </div>
        <div
          ref={feedbackRef}
          tabIndex={-1}
          aria-hidden={!answered || undefined}
          inert={!answered}
          className={cn("flex flex-col gap-2 border-t pt-3 outline-none [grid-area:1/1]", !answered && "invisible")}
        >
          <div className="relative flex items-center justify-between gap-3">
            {answered && right && <Seal />}
            <span className={cn("text-sm font-bold", right ? "text-success" : "text-primary-soft-foreground")}>
              {right ? t`Correct!` : t`The answer is ${n} “${choice}”`}
            </span>
            <Button variant="outline" onClick={onNext} className="shrink-0">
              {i === SAMPLES.length - 1 ? t`See your score` : t`Next question`}
            </Button>
          </div>
          <p className="text-sm leading-sentence text-subtle-foreground">
            <Trans>
              <b className="font-bold text-foreground">{pattern}</b>: {why}
            </Trans>
          </p>
        </div>
      </div>
    </>
  );
}

/** The last card: the score, and sign-up. */
function Score({ score, onRestart }: { score: number; onRestart: () => void }) {
  const total = SAMPLES.length;
  return (
    <>
      <p className="text-body-sm text-subtle-foreground">
        <Trans>
          <strong className="text-title text-foreground tabular-nums">{score}</strong> of {total} right.
        </Trans>
      </p>
      <p className="text-body-sm leading-sentence text-subtle-foreground">
        <Trans>With an account, you can take full 45-question mock tests.</Trans>
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Button asChild>
          <Link to="/signup">
            <Trans>Create account</Trans>
          </Link>
        </Button>
        <Button variant="outline" onClick={onRestart}>
          <Trans>Try again</Trans>
        </Button>
      </div>
    </>
  );
}

/**
 * The 正解 seal: a round hanko with a chubby cat peeking over its rim, pressed on in the space after the verdict.
 * It repeats the verdict, so screen readers skip it.
 */
function Seal() {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 72 74"
      initial={{ opacity: 0, scale: 1.6 }}
      animate={{ opacity: 0.9, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 14 }}
      className="pointer-events-none absolute top-1/2 left-22 h-auto w-18 -translate-y-[70%] -rotate-6 fill-card stroke-primary"
    >
      {/* Drawn back to front: ears, head, then the stamp over the cat's chin, then the paws on the rim. */}
      <path d="M22 11 L21 1 L30 6 M50 11 L51 1 L42 6" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="36" cy="17" rx="16" ry="12" strokeWidth="2" />
      <path d="M29 13 q2 -2.5 4 0 M39 13 q2 -2.5 4 0 M33 17 q1.5 1.8 3 0 q1.5 1.8 3 0" fill="none" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 14 l-6 -1 M19 17 l-6 1 M53 14 l6 -1 M53 17 l6 1" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="36" cy="46" r="26" strokeWidth="2.5" />
      <circle cx="36" cy="46" r="22.5" fill="none" strokeWidth="1" opacity="0.6" />
      <ellipse cx="28" cy="21.5" rx="4.5" ry="3.2" strokeWidth="1.8" />
      <ellipse cx="44" cy="21.5" rx="4.5" ry="3.2" strokeWidth="1.8" />
      <text x="36" y="52" textAnchor="middle" fontSize="17" className="fill-primary stroke-none font-jp font-bold">
        正解
      </text>
    </motion.svg>
  );
}
