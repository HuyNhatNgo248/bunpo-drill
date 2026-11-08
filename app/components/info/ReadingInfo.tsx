import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { Card } from "~/components/ui/card";
import { JLPT_LEVELS, type JlptLevel } from "~/lib/levels";
import { LEVEL_TYPES, type ReadingType, type Trap } from "~/lib/reading-payload";
import { SECTION_TITLES, sectionGloss, TRAP_LABELS } from "~/lib/sections";
import { cn } from "~/lib/utils";
import { SampleQuestion } from "./SampleQuestion";

type Passage = { type: ReadingType; aim: MessageDescriptor; length: Partial<Record<JlptLevel, string>> };

/** The kinds of passage and how long each is at each level, in characters (jlpt.jp 大問のねらい). The levels that have the kind are LEVEL_TYPES's. */
const PASSAGES: Passage[] = [
  { type: "reading-short", aim: msg`Read explanations or instructions and understand what they say.`, length: { N1: "200", N2: "200", N3: "150–200", N4: "100–200", N5: "80" } },
  { type: "reading-mid", aim: msg`Read an essay or explanation and understand key words, causes and reasons.`, length: { N1: "500", N2: "500", N3: "350", N4: "450", N5: "250" } },
  { type: "reading-long", aim: msg`Read a longer text and grasp its outline and the writer’s thinking.`, length: { N1: "1000", N3: "550" } },
  { type: "reading-integrated", aim: msg`Read several texts side by side and compare and combine what they say.`, length: { N1: "600", N2: "600" } },
  { type: "reading-claim", aim: msg`Read a logical text and grasp the claim or opinion it makes as a whole.`, length: { N1: "1000", N2: "900" } },
  { type: "reading-info", aim: msg`Find the information you need in an ad, notice, brochure or business document.`, length: { N1: "700", N2: "700", N3: "600", N4: "400", N5: "250" } },
];

const TRAPS: Record<Trap, MessageDescriptor> = {
  "changed-detail": msg`Almost the passage, with a time, number or name swapped.`,
  opposite: msg`Says the reverse of what the passage says.`,
  "not-in-text": msg`Sounds sensible, but the passage never says it.`,
  "true-not-answer": msg`Matches the passage, but does not answer this question.`,
  "over-general": msg`Stretches a specific point into a general claim.`,
  "missed-condition": msg`Drops an “only if” or an “except” that the passage attaches.`,
};

/** The sample's choices with the trap each wrong one is built on; the right one has none. */
const CHOICES: { text: string; trap?: Trap }[] = [
  { text: "図書館は一日中閉まっている。", trap: "changed-detail" },
  { text: "本を返すことは、午前中はできない。", trap: "opposite" },
  { text: "午後一時より前には、本を借りることができない。" },
  { text: "点検のため、来週は毎日午後から開館する。", trap: "not-in-text" },
];

/** The kinds of reading passage with their length at each level, an example passage that marks its proof, and the traps that wrong answers are built on. */
export function ReadingInfo() {
  const { i18n, t } = useLingui();
  const [answered, setAnswered] = useState(false);
  // The sentences that prove the answer, marked once it is in.
  const proof = answered ? "highlighter" : "";
  return (
    <>
      {PASSAGES.map(({ type, aim, length }) => {
        const gloss = sectionGloss(i18n, type);
        return (
          <Card key={type} className="flex flex-col gap-4 p-5 md:p-6">
            <h2 className="text-prompt font-bold">
              <span lang="ja" className="font-jp">
                {SECTION_TITLES[type]}
              </span>
              {gloss && <span className="block text-caption font-normal text-subtle-foreground">{gloss}</span>}
            </h2>
            <p className="text-body-sm leading-relaxed">{i18n._(aim)}</p>
            <dl className="grid grid-cols-5 gap-2">
              {[...JLPT_LEVELS].reverse().map((level) => {
                const chars = LEVEL_TYPES[level].includes(type) ? length[level] : undefined;
                return (
                  <div key={level} className={cn("flex min-w-0 flex-col gap-0.5 rounded-lg border px-2.5 py-2", chars ? "bg-background" : "border-transparent")}>
                    <dt className="text-caption font-semibold text-subtle-foreground">{level}</dt>
                    <dd className={cn("text-caption tabular-nums md:text-body-sm", chars ? "font-semibold" : "text-muted-foreground")}>
                      {chars ? <span lang="ja" className="font-jp">{t`~${chars} chars`}</span> : "—"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Card>
        );
      })}
      <p className="-mt-2 text-caption leading-sentence text-subtle-foreground">
        <Trans>Lengths are in characters, as the JLPT states them. For two texts compared, it is the total.</Trans>
      </p>

      <Card className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-prompt font-bold">
            <Trans>Try a short passage</Trans>
          </h2>
          <p className="text-caption leading-sentence text-subtle-foreground">
            <Trans>In the app each passage is timed. After you answer, the sentences that prove the answer are marked.</Trans>
          </p>
        </div>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <div lang="ja" className="rounded-xl border bg-background p-4 font-jp text-base leading-passage">
            お客様各位。<span className={proof}>来週の月曜日は、設備点検のため、図書館は午後一時から開館いたします。</span>
            ただし、本の返却は、入り口の返却ボックスに、いつでも入れることができます。
            <span className={proof}>貸し出しは、開館後にお願いします。</span>
          </div>
          <SampleQuestion
            prompt="月曜日について、正しいものはどれか。"
            choices={CHOICES.map((choice) => choice.text)}
            answer={2}
            stacked
            onPick={() => setAnswered(true)}
            why={msg`Lending comes only after opening at 午後一時, so 3 is the answer. The marked sentences are the proof.`}
          >
            <ul className="mt-1 flex flex-col gap-0.5 text-caption text-primary-soft-foreground">
              {CHOICES.map(({ trap }, index) => trap && <li key={trap}>{`${index + 1} · ${i18n._(TRAP_LABELS[trap])}`}</li>)}
            </ul>
          </SampleQuestion>
        </div>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex max-w-160 flex-col gap-1">
          <h2 className="text-prompt font-bold">
            <Trans>How wrong answers are built</Trans>
          </h2>
          <p className="text-caption leading-sentence text-subtle-foreground">
            <Trans>Wrong choices are not random. Each one copies the passage and breaks it in one way. The results name the trap you fell into.</Trans>
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {(Object.keys(TRAPS) as Trap[]).map((trap) => (
            <Card key={trap} className="flex flex-col gap-1 p-4">
              <h3 className="text-body-sm font-semibold">{i18n._(TRAP_LABELS[trap])}</h3>
              <p className="text-caption leading-sentence text-subtle-foreground">{i18n._(TRAPS[trap])}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
