import type { MessageDescriptor } from "@lingui/core";
import { Trans, useLingui } from "@lingui/react/macro";
import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";
import { SECTION_TITLES, sectionGloss, sectionInstruction } from "~/lib/sections";
import type { SectionType } from "~/lib/payload";

/**
 * One 問題 of the test: its number, official name and gloss, what it checks, the instruction the exam prints above it and
 * what to watch for, beside an example (`children`) to answer. `count` is the size in a test of the app, when it has a fixed one.
 */
export function InfoSection({
  type,
  no,
  count,
  aim,
  tip,
  children,
}: {
  type: SectionType;
  no: number;
  count?: MessageDescriptor;
  aim: MessageDescriptor;
  tip?: MessageDescriptor;
  children: ReactNode;
}) {
  const { i18n } = useLingui();
  const gloss = sectionGloss(i18n, type);
  return (
    <Card className="flex flex-col gap-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-body-sm font-semibold text-secondary-foreground">
          {no}
        </span>
        <h2 className="min-w-0 flex-1 basis-60 text-prompt font-bold">
          <span lang="ja" className="font-jp">
            {SECTION_TITLES[type]}
          </span>
          {gloss && <span className="block text-caption font-normal text-subtle-foreground">{gloss}</span>}
        </h2>
        {count && (
          <span className="rounded-md border bg-muted px-2.5 py-1 text-caption font-semibold text-secondary-foreground tabular-nums">
            {i18n._(count)}
          </span>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Fact label={<Trans>What it checks</Trans>}>
            <p className="text-body-sm leading-relaxed">{i18n._(aim)}</p>
          </Fact>
          <Fact label={<Trans>The exam prints</Trans>}>
            <p className="text-caption leading-sentence text-secondary-foreground">{i18n._(sectionInstruction(type, [1]))}</p>
          </Fact>
          {tip && (
            <div className="flex flex-col gap-1.5 rounded-box bg-background p-3.5">
              <span className="text-caption font-semibold text-subtle-foreground">
                <Trans>Watch for</Trans>
              </span>
              <p className="text-caption leading-sentence text-secondary-foreground">{i18n._(tip)}</p>
            </div>
          )}
        </div>
        {children}
      </div>
    </Card>
  );
}

function Fact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-caption font-semibold text-subtle-foreground">{label}</span>
      {children}
    </div>
  );
}
