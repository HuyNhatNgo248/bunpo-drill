import { m, useInView, useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useState } from "react";
import type { SectionType } from "~/lib/payload";
import { cn } from "~/lib/utils";

/** The 問題 the welcome page shows: N2's, so no 長文 (an N3 and N1 one). */
export type DemoSection = Exclude<SectionType, "reading-long">;

/** The demos of more than 1 step: sort the pieces, then mark ★; fill blank 1, then blank 2. */
export const DEMO_STEPS: Partial<Record<DemoSection, number>> = {
  "sentence-order": 2,
  passage: 2,
};

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
export function FormatDemo({ type, step }: { type: DemoSection; step: number }) {
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
      {type === "kanji-reading" && (
        <p>
          会議の日程を
          <ruby>
            <u className="decoration-faint underline-offset-4">調整</u>
            <Reading text="ちょうせい" shown={step >= 1} />
          </ruby>
          した。
        </p>
      )}
      {type === "kanji-writing" && (
        <p>
          パスポートを
          <Swap from="しんせい" to="申請" done={step >= 1} />
          した。
        </p>
      )}
      {type === "reading-short" && (
        <p>
          来週から図書館の開館時間が変わります。<Proof shown={step >= 1}>平日は夜8時まで開いています。</Proof>
        </p>
      )}
      {type === "reading-mid" && (
        <p>
          失敗は悪いことだと思われがちだ。<Proof shown={step >= 1}>しかし、失敗から学ぶことのほうが多い。</Proof>
        </p>
      )}
      {type === "reading-integrated" && (
        <p className="flex flex-col gap-0.5">
          <span>
            A：<Proof shown={step >= 1}>在宅勤務なら、通勤の時間を使える。</Proof>
          </span>
          <span>
            B：<Proof shown={step >= 1}>同僚と話す機会が減ってしまう。</Proof>
          </span>
        </p>
      )}
      {type === "reading-claim" && (
        <p>
          便利さを求めるあまり、<Proof shown={step >= 1}>私たちは待つ力を失ってしまったのではないか。</Proof>
        </p>
      )}
      {type === "reading-info" && (
        <p className="flex flex-wrap gap-x-3">
          <span>【料金】大人 800円</span>
          <Proof shown={step >= 1}>学生 500円</Proof>
          <span>【受付】9:00〜17:00</span>
        </p>
      )}
    </div>
  );
}

/** A word's reading over it, dropping in. It is laid out from the start, so it moves nothing. */
function Reading({ text, shown }: { text: string; shown: boolean }) {
  return (
    <m.rt
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="font-medium text-primary"
    >
      {text}
    </m.rt>
  );
}

/** A word in kana that turns into its kanji, both stacked in one cell, so the swap moves nothing. */
function Swap({ from, to, done }: { from: string; to: string; done: boolean }) {
  return (
    <span className="inline-grid border-b border-faint px-0.5 text-center">
      <m.span initial={false} animate={{ opacity: done ? 0 : 1 }} className="[grid-area:1/1]">
        {from}
      </m.span>
      <m.span
        initial={false}
        animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="font-medium text-primary [grid-area:1/1]"
      >
        {to}
      </m.span>
    </span>
  );
}

/** The sentence that proves the answer, marked once the demo plays, as the results mark it. */
function Proof({ shown, children }: { shown: boolean; children: string }) {
  return (
    <span
      className={cn(
        "rounded-sm underline decoration-transparent underline-offset-4 transition-colors duration-500",
        shown && "bg-primary-soft text-primary-soft-foreground decoration-primary",
      )}
    >
      {children}
    </span>
  );
}

/** A blank that drops its answer in. The answer is always laid out, unseen until filled, so filling it moves nothing. */
function Blank({ text, label, filled }: { text: string; label?: string; filled: boolean }) {
  return (
    <span className="relative inline-block border-b border-faint px-0.5 text-center">
      <m.span
        initial={false}
        animate={filled ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="inline-block font-medium text-primary"
      >
        {text}
      </m.span>
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
          <m.span
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
          </m.span>
        );
      })}
      <span>合格した。</span>
    </p>
  );
}
