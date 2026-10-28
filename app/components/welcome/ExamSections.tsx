import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { Card } from "~/components/ui/card";
import type { SectionType } from "~/lib/payload";
import { SECTION_TITLES, sectionGloss } from "~/lib/sections";

/** The three sections of the exam's 文法 part, in their real order, with a tiny example of each. Examples stay Japanese. */
const SECTIONS: { no: number; type: SectionType; count: MessageDescriptor; how: MessageDescriptor; example: string }[] = [
  {
    no: 1,
    type: "fill-blank",
    count: msg`15 questions`,
    how: msg`Choose the most natural form for the （　） in a sentence, out of 4.`,
    example: "雨が降っている（　）、試合は行われた。",
  },
  {
    no: 2,
    type: "sentence-order",
    count: msg`15 questions`,
    how: msg`Put 4 pieces in order, and choose the one that goes in ★.`,
    example: "彼は ＿ ＿ ★ ＿ 合格した。",
  },
  {
    no: 3,
    type: "passage",
    count: msg`3 passages × 5 questions`,
    how: msg`Read a passage, and fill each blank with the words that fit its flow.`,
    example: "毎日練習した（1）、合格できた。",
  },
];

export function ExamSections() {
  const { i18n } = useLingui();
  return (
    <section aria-labelledby="exam-sections" className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-2">
        <h2 id="exam-sections" className="text-xl font-bold text-balance">
          <Trans>The same three formats as the real exam</Trans>
        </h2>
        <p className="max-w-160 leading-sentence text-subtle-foreground">
          <Trans>
            In the same order and format as the grammar part of the JLPT. Each part has 15 questions, 45 in all by default, and
            you can change the counts.
          </Trans>
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {SECTIONS.map(({ no, type, count, how, example }) => {
          const gloss = sectionGloss(i18n, type);
          return (
            <Card key={no} className="flex min-w-0 flex-col gap-2 p-4.5 md:p-5">
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
              <p lang="ja" className="rounded-lg bg-muted px-2.5 py-2 font-jp text-caption leading-sentence text-secondary-foreground">
                {example}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
