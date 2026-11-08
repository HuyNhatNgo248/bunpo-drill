import { Trans, useLingui } from "@lingui/react/macro";
import { Tabs } from "radix-ui";
import { useRef, useState } from "react";
import { Card } from "~/components/ui/card";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";
import { cn } from "~/lib/utils";
import { DEMO_STEPS, FormatDemo, useDemoSteps } from "./FormatDemo";
import { SUBJECT_SECTIONS, type Section } from "./helpers/subjectSections";
import { AutoHeight } from "./AutoHeight";
import { SUBJECTS, SubjectList } from "./SubjectList";

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
