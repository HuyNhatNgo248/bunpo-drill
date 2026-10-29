import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { motion } from "motion/react";
import { useRef } from "react";
import { Card } from "~/components/ui/card";
import type { SectionType } from "~/lib/payload";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import { DEMO_STEPS, FormatDemo, useDemoSteps } from "./FormatDemo";

const MotionCard = motion.create(Card);

type Section = { no: number; type: SectionType; count: MessageDescriptor; how: MessageDescriptor };

/** The three sections of the exam's 文法 part, in their real order. */
const SECTIONS: Section[] = [
  {
    no: 1,
    type: "fill-blank",
    count: msg`15 questions`,
    how: msg`Choose the most natural form for the （　） in a sentence, out of 4.`,
  },
  {
    no: 2,
    type: "sentence-order",
    count: msg`15 questions`,
    how: msg`Put 4 pieces in order, and choose the one that goes in ★.`,
  },
  {
    no: 3,
    type: "passage",
    count: msg`3 passages × 5 questions`,
    how: msg`Read a passage, and fill each blank with the words that fit its flow.`,
  },
];

export function ExamSections() {
  return (
    <section aria-labelledby="exam-sections" className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-2">
        <h2 id="exam-sections" className="text-xl font-bold text-balance">
          <Trans>The same three formats as the real exam</Trans>
        </h2>
        <p className="max-w-160 leading-sentence text-subtle-foreground">
          <Trans>
            In the same order and format as the grammar part of the JLPT. A full test has 15 questions per part, 45 in all.
          </Trans>
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {SECTIONS.map((section, i) => (
          <SectionCard key={section.no} section={section} index={i} />
        ))}
      </div>
    </section>
  );
}

/** One section, with a tiny example that solves itself when the card comes into view, and again on hover. */
function SectionCard({ section: { no, type, count, how }, index }: { section: Section; index: number }) {
  const { i18n } = useLingui();
  const ref = useRef<HTMLElement>(null);
  const { step, replay } = useDemoSteps(ref, DEMO_STEPS[type]);
  const gloss = sectionGloss(i18n, type);
  return (
    <MotionCard
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.1 }}
      onPointerEnter={replay}
      className="flex min-w-0 flex-col gap-2 p-4.5 md:p-5"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-body-sm font-bold">
          <Trans>Part {no}</Trans>
        </span>
        <span className="text-xs font-semibold text-indigo tabular-nums">{i18n._(count)}</span>
      </div>
      <h3 className="text-sm font-medium text-secondary-foreground">
        <span lang="ja" className="font-jp">
          {SECTION_TITLES[type]}
        </span>
        {gloss && ` · ${gloss}`}
      </h3>
      <p className="text-caption leading-sentence text-muted-foreground">{i18n._(how)}</p>
      <FormatDemo type={type} step={step} />
    </MotionCard>
  );
}
