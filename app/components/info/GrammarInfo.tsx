import { msg } from "@lingui/core/macro";
import { SUBJECT_SECTIONS } from "~/components/welcome/helpers/subjectSections";
import { InfoSection } from "./InfoSection";
import { SampleQuestion } from "./SampleQuestion";

/** The slot of a blank or a piece in a sentence: a line to write on. */
const blank = "mx-1 inline-block min-w-12 border-b-2 border-faint text-center text-subtle-foreground";

const [formCount, orderCount, passageCount] = SUBJECT_SECTIONS.grammar.sections.map((section) => section.count);

/** The three 問題 of the grammar part, each with an example. */
export function GrammarInfo() {
  return (
    <>
      <InfoSection
        type="fill-blank"
        no={1}
        count={formCount}
        aim={msg`Judge which grammar form fits the content of a sentence with a blank.`}
        tip={msg`Check what comes before the blank (a noun, the plain form, the て-form) and the tone of the sentence, not only the meaning.`}
      >
        <SampleQuestion
          prompt={
            <>
              彼は忙しい<span className={blank}>（　　）</span>、毎日ジムに通っている。
            </>
          }
          choices={["にもかかわらず", "ばかりに", "おかげで", "ことから"]}
          answer={0}
          why={msg`「にもかかわらず」 joins two things that clash: busy, yet goes to the gym. The others give a reason, not a contrast.`}
        />
      </InfoSection>
      <InfoSection
        type="sentence-order"
        no={2}
        count={orderCount}
        aim={msg`Build a sentence that is grammatically correct and makes sense, then pick the piece for the ★ slot.`}
        tip={msg`Find the pair that must stay together first, then build outward.`}
      >
        <SampleQuestion
          prompt={
            <>
              彼女は<span className={blank}>＿＿</span>
              <span className={blank}>＿＿</span>
              <span className={`${blank} border-primary font-bold text-primary`}>★</span>
              <span className={blank}>＿＿</span>続けている。
            </>
          }
          choices={["ことなく", "努力を", "どんな時も", "怠る"]}
          answer={3}
          why={msg`The order is どんな時も → 努力を → 怠る → ことなく, so 怠る sits in ★: 「怠ることなく続けている」.`}
        />
      </InfoSection>
      <InfoSection
        type="passage"
        no={3}
        count={passageCount}
        aim={msg`Judge which sentence or expression fits the flow of a passage with numbered blanks.`}
        tip={msg`Look at the sentences before and after. A connector must match whether the next idea agrees, contrasts or adds.`}
      >
        <SampleQuestion
          prompt={
            <>
              最近、電子書籍を利用する人が増えている。<span className={blank}>（ 1 ）</span>
              、紙の本には紙の本のよさがあると考える人も多い。
            </>
          }
          choices={["しかし", "そのうえ", "したがって", "たとえば"]}
          answer={0}
          why={msg`The first sentence says e-books are growing; the second brings an opposing view. 「しかし」 marks that turn.`}
        />
      </InfoSection>
    </>
  );
}
