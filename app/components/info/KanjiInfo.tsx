import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { SUBJECT_SECTIONS } from "~/components/welcome/helpers/subjectSections";
import { JLPT_LEVELS } from "~/lib/levels";
import { cn } from "~/lib/utils";
import { InfoSection } from "./InfoSection";
import { SampleQuestion } from "./SampleQuestion";

const [readingCount, writingCount] = SUBJECT_SECTIONS.kanji.sections.map((section) => section.count);

/** Which levels of the JLPT have the 問題 (jlpt.jp 大問のねらい): 表記 is not on N1. */
const LEVELS_OF = { reading: JLPT_LEVELS, writing: JLPT_LEVELS.filter((level) => level !== "N1") };

const UNDERLINE = "underline decoration-1 underline-offset-6";

/** The two 問題 of the kanji part, each with the levels that have it and an example. */
export function KanjiInfo() {
  return (
    <>
      <InfoSection
        type="kanji-reading"
        no={1}
        count={readingCount}
        aim={msg`Read a word written in kanji and choose how it is read.`}
        tip={msg`Long and short vowels, small っ and voiced sounds (ち or じ) are what the wrong choices change.`}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <Levels levels={LEVELS_OF.reading} />
          <SampleQuestion
            prompt={
              <>
                彼は<u className={UNDERLINE}>慎重</u>に運転した。
              </>
            }
            choices={["しんちょう", "しんじょう", "じんちょう", "しんじゅう"]}
            answer={0}
            why={msg`慎重 is read しんちょう. The other three keep the sound pattern but change one syllable.`}
          />
        </div>
      </InfoSection>
      <InfoSection
        type="kanji-writing"
        no={2}
        count={writingCount}
        aim={msg`Read a word in hiragana and choose how it is written.`}
        tip={msg`The wrong choices look like the right one. Compare the parts of each kanji, not the whole shape.`}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <Levels levels={LEVELS_OF.writing} note={<Trans>N1 has no writing part. On N5 the word may be written in kanji or katakana.</Trans>} />
          <SampleQuestion
            prompt={
              <>
                事故の<u className={UNDERLINE}>げんいん</u>を調べる。
              </>
            }
            choices={["原因", "源因", "原困", "原囚"]}
            answer={0}
            why={msg`原因 (cause). 源 is the “source” of a river, and 困 and 囚 only look like 因.`}
          />
        </div>
      </InfoSection>
    </>
  );
}

/** The levels of the JLPT that have a 問題, the others dashed. */
function Levels({ levels, note }: { levels: readonly string[]; note?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-caption font-semibold text-subtle-foreground">
        <Trans>On these levels</Trans>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {[...JLPT_LEVELS].reverse().map((level) => (
          <span
            key={level}
            className={cn(
              "rounded-md border px-2.5 py-1 text-caption",
              levels.includes(level) ? "bg-muted font-semibold text-secondary-foreground" : "border-dashed border-input text-muted-foreground",
            )}
          >
            {level}
          </span>
        ))}
      </div>
      {note && <p className="text-caption leading-sentence text-subtle-foreground">{note}</p>}
    </div>
  );
}
