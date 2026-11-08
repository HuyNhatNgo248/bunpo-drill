import { Trans, useLingui } from "@lingui/react/macro";
import { AppHeader } from "~/components/layout/header";
import { QuoteFooter } from "~/components/layout/QuoteFooter";
import { PATHS } from "~/components/layout/tabCache";
import { PageTitle } from "~/components/PageTitle";
import type { TestKind } from "~/lib/views";
import { GrammarInfo } from "./GrammarInfo";
import { KanjiInfo } from "./KanjiInfo";
import { ReadingInfo } from "./ReadingInfo";

const PAGES = { grammar: GrammarInfo, kanji: KanjiInfo, reading: ReadingInfo };

/**
 * What a subject's test holds: its 問題 in the exam's order, each with what it checks, how the exam words it and an
 * example to answer. The way back goes to the subject's tab.
 */
export function Info({ subject }: { subject: TestKind }) {
  const { t } = useLingui();
  const titles = { grammar: t`What's on the grammar test`, kanji: t`What's on the kanji test`, reading: t`What's on the reading test` };
  const intros = {
    grammar: <Trans>The grammar part of the JLPT has three kinds of question, always in this order. Here is what each one checks, with a question to try.</Trans>,
    kanji: <Trans>The kanji part of the JLPT asks two things: how a kanji word is read, and how a word in hiragana is written. Study a chapter as flashcards, then take its quiz.</Trans>,
    reading: <Trans>Reading is a set of passages. Each kind has its own length and its own job, and which kinds you get depends on the level.</Trans>,
  };
  const Page = PAGES[subject];
  const back = { to: PATHS[subject], label: t`Back to the tests` };
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader account mobileTitle={titles[subject]} back={{ to: back.to, label: back.label }} />
      <main className="mx-auto flex w-full max-w-240 flex-1 flex-col gap-4 px-4 pt-4 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <PageTitle meta={<Trans>The test's format</Trans>} back={{ to: back.to, label: back.label }}>
          {titles[subject]}
        </PageTitle>
        <p className="max-w-160 text-body-sm leading-relaxed text-subtle-foreground">{intros[subject]}</p>
        <Page />
      </main>
      <QuoteFooter />
    </div>
  );
}
