import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { Tabs } from "radix-ui";
import { useRef, useState } from "react";
import { Card } from "~/components/ui/card";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import { cn } from "~/lib/utils";
import type { TestKind } from "~/lib/views";
import { DEMO_STEPS, FormatDemo, useDemoSteps, type DemoSection } from "./FormatDemo";
import { AutoHeight } from "./AutoHeight";
import { SUBJECTS, SubjectList } from "./SubjectList";

type Section = { type: DemoSection; count: MessageDescriptor; how: MessageDescriptor };

/**
 * Each subject's 問題, in the exam's order. Grammar and kanji give the size of a test in the app; reading gives the N2
 * exam's own, which a reading set follows.
 */
const SUBJECT_SECTIONS: Record<TestKind, { intro: MessageDescriptor; sections: Section[] }> = {
  grammar: {
    intro: msg`In the same order and format as the grammar part of the JLPT. A full test has 15 questions per part, 45 in all.`,
    sections: [
      { type: "fill-blank", count: msg`15 questions`, how: msg`Choose the most natural form for the （　） in a sentence, out of 4.` },
      { type: "sentence-order", count: msg`15 questions`, how: msg`Put 4 pieces in order, and choose the one that goes in ★.` },
      { type: "passage", count: msg`3 passages × 5 questions`, how: msg`Read a passage, and fill each blank with the words that fit its flow.` },
    ],
  },
  kanji: {
    intro: msg`The two kanji parts of the JLPT, in their format. A test has about 45 questions, from every chapter of the level.`,
    sections: [
      { type: "kanji-reading", count: msg`22 questions`, how: msg`Choose how the underlined word is read, out of 4 readings that differ by a sound or two.` },
      { type: "kanji-writing", count: msg`23 questions`, how: msg`Choose how the underlined word is written, out of 4 look-alike or sound-alike kanji.` },
    ],
  },
  reading: {
    intro: msg`The five reading parts of the N2 exam, in its order. The answers show the sentence that proves each one.`,
    sections: [
      { type: "reading-short", count: msg`5 texts × 1 question`, how: msg`Read a text of about 200 characters, and answer a question on it.` },
      { type: "reading-mid", count: msg`3 texts × 3 questions`, how: msg`Read a text of about 500 characters: its reasons, what a phrase points to, and its conclusion.` },
      { type: "reading-integrated", count: msg`2 texts × 2 questions`, how: msg`Read two texts on one topic, and compare what each one says.` },
      { type: "reading-claim", count: msg`1 text × 3 questions`, how: msg`Read a long essay, and find what the writer is arguing.` },
      { type: "reading-info", count: msg`1 flyer × 2 questions`, how: msg`Find what you need in a notice, flyer or table.` },
    ],
  },
};

/** The formats of each subject, a tab each, with a tiny example per 問題 that solves itself. */
export function ExamSections() {
  const { i18n } = useLingui();
  const [subject, setSubject] = useState<string>("grammar");
  return (
    <section aria-labelledby="exam-sections" className="flex flex-col gap-6 border-t pt-12">
      <h2 id="exam-sections" className="text-xl font-bold text-balance">
        <Trans>The same formats as the real exam</Trans>
      </h2>
      <Tabs.Root value={subject} onValueChange={setSubject} className="flex flex-col gap-4">
        <SubjectList subjects={SUBJECTS} value={subject} onPick={setSubject} />
        <AutoHeight>
          {SUBJECTS.map((kind) => {
            const { intro, sections } = SUBJECT_SECTIONS[kind];
            return (
              <Tabs.Content key={kind} value={kind} className="flex flex-col gap-4 outline-none">
                <p className="max-w-160 leading-sentence text-subtle-foreground">{i18n._(intro)}</p>
                <div className={cn("grid gap-3 md:gap-4", sections.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
                  {sections.map((section, i) => (
                    <SectionCard key={section.type} section={section} no={i + 1} />
                  ))}
                </div>
              </Tabs.Content>
            );
          })}
        </AutoHeight>
      </Tabs.Root>
    </section>
  );
}

/** One 問題, with a tiny example that solves itself when the card comes into view, and again on hover. */
function SectionCard({ section: { type, count, how }, no }: { section: Section; no: number }) {
  const { i18n } = useLingui();
  const ref = useRef<HTMLElement>(null);
  const { step, replay } = useDemoSteps(ref, DEMO_STEPS[type] ?? 1);
  const gloss = sectionGloss(i18n, type);
  return (
    <Card
      ref={ref}
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
    </Card>
  );
}
