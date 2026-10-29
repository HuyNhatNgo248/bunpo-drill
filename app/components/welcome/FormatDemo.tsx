import { motion, useInView, useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useState } from "react";
import type { SectionType } from "~/lib/payload";
import { cn } from "~/lib/utils";

/** How many steps each demo plays: fill the blank; sort the pieces, then mark ★; fill blank 1, then blank 2. */
export const DEMO_STEPS: Record<SectionType, number> = { "fill-blank": 1, "sentence-order": 2, passage: 2 };

/**
 * Plays a demo's steps one by one, the first time `ref` scrolls into view; `replay` plays them again once they are done.
 * With reduced motion, the demo shows solved at once.
 */
export function useDemoSteps(ref: RefObject<HTMLElement | null>, steps: number) {
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) return setStep(steps);
    setStep(0);
    const timers = Array.from({ length: steps }, (_, i) => setTimeout(() => setStep(i + 1), 900 + i * 800));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, runs, steps]);

  return { step, replay: () => step === steps && setRuns(runs + 1) };
}

/** A tiny example of a format solving itself, step by step. Examples stay Japanese. */
export function FormatDemo({ type, step }: { type: SectionType; step: number }) {
  return (
    <div lang="ja" className="mt-auto rounded-lg bg-muted px-2.5 py-2 font-jp text-caption leading-sentence text-secondary-foreground">
      {type === "fill-blank" && (
        <p>
          雨が降っている（<Blank text="にもかかわらず" filled={step >= 1} />）、試合は行われた。
        </p>
      )}
      {type === "sentence-order" && <OrderDemo step={step} />}
      {type === "passage" && (
        <p>
          毎日練習した
          <Blank text="かいがあって" label="1" filled={step >= 1} />
          、合格できた。
          <Blank text="しかも" label="2" filled={step >= 2} />
          、本番もあまり緊張しなかった。
        </p>
      )}
    </div>
  );
}

/** A blank that drops its answer in. The answer is always laid out, unseen until filled, so filling it moves nothing. */
function Blank({ text, label, filled }: { text: string; label?: string; filled: boolean }) {
  return (
    <span className="relative inline-block border-b border-faint px-0.5 text-center">
      <motion.span
        initial={false}
        animate={filled ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="inline-block font-medium text-primary"
      >
        {text}
      </motion.span>
      {label && (
        <span className={cn("absolute inset-0 transition-opacity", filled && "opacity-0")}>（{label}）</span>
      )}
    </span>
  );
}

/** The 4 pieces, in their right order. The third goes in ★. */
const PIECES = ["毎日", "練習した", "かいがあって", "試験に"];
const SHUFFLED = [3, 2, 0, 1];

/** 4 shuffled pieces that slide into order, then the one in ★ lights up. */
function OrderDemo({ step }: { step: number }) {
  const order = step >= 1 ? [0, 1, 2, 3] : SHUFFLED;
  return (
    <p className="flex flex-wrap items-center gap-1">
      <span>彼は</span>
      {order.map((piece, slot) => {
        const star = step >= 2 && slot === 2;
        return (
          <motion.span
            key={piece}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "rounded-md border bg-card px-1.5 transition-colors",
              star && "border-primary-border bg-primary-soft text-primary-soft-foreground",
            )}
          >
            {star && "★ "}
            {PIECES[piece]}
          </motion.span>
        );
      })}
      <span>合格した。</span>
    </p>
  );
}
