import { Plural, Trans } from "@lingui/react/macro";
import { Layers } from "lucide-react";
import { Link } from "react-router";
import { GrammarChips } from "~/components/grammar-chips";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { WordChips } from "~/components/WordChips";
import { cardsOf } from "~/lib/links";
import type { ResultsView } from "~/lib/views";

/**
 * What to review: the grammar of the wrong answers, on a kanji test their words, with the way to their flashcards, or
 * on a reading set the kinds of question it missed.
 * On a `trial` test the chips can't be marked reviewed, and a kanji test's words have no way to their flashcards.
 */
export function ReviewCard({ results, trial = false }: { results: ResultsView; trial?: boolean }) {
  return (
    <Card className="flex flex-col gap-3.5 p-4 md:gap-4 md:p-6">
      <h2 className="text-base font-semibold md:text-lg">
        {results.kind === "kanji" ? (
          <Trans>Words to study</Trans>
        ) : results.kind === "reading" ? (
          <Trans>Question kinds to work on</Trans>
        ) : (
          <Trans>Grammar worth reviewing</Trans>
        )}
      </h2>
      {results.kind === "reading" && missedKinds(results).length > 0 ? (
        <MissedKinds kinds={missedKinds(results)} trial={trial} />
      ) : results.kind === "kanji" && results.chapter !== null && results.words.length > 0 ? (
        trial ? (
          // The flashcards need an account.
          <WordChips words={results.words} />
        ) : (
          <WordsToStudy results={results} chapter={results.chapter} />
        )
      ) : results.review.length > 0 ? (
        <GrammarChips testId={trial ? null : results.id} chips={results.review} />
      ) : (
        <p className="text-subtle-foreground">
          <Trans>Nothing to review. You got every question right.</Trans>
        </p>
      )}
    </Card>
  );
}

function WordsToStudy({ results, chapter }: { results: ResultsView; chapter: number }) {
  const count = results.words.length;
  return (
    <>
      <WordChips words={results.words} />
      <Button asChild className="font-semibold md:self-start md:font-medium">
        <Link to={cardsOf(results.level, chapter, { words: results.words.map((word) => word.wordId) })}>
          <Layers aria-hidden="true" />
          <Plural value={count} one="Study this word as a flashcard" other="Study these # as flashcards" />
        </Link>
      </Button>
      <p className="text-caption text-muted-foreground">
        <Trans>They're marked as not learned, so they also come first in this chapter's flashcards.</Trans>
      </p>
    </>
  );
}

/** The kinds of the reading questions answered wrong, with how often, most first. */
function missedKinds(results: ResultsView) {
  const counts = new Map<string, number>();
  for (const question of results.sections.flatMap((section) => section.groups.flatMap((group) => group.questions))) {
    if (!question.correct && question.reading) counts.set(question.reading.kind, (counts.get(question.reading.kind) ?? 0) + 1);
  }
  return [...counts].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);
}

function MissedKinds({ kinds, trial }: { kinds: { kind: string; count: number }[]; trial: boolean }) {
  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {kinds.map(({ kind, count }) => (
          <li key={kind} className="flex items-center gap-2 rounded-lg border border-primary-border bg-primary-soft px-3 py-1.5 text-primary-soft-foreground">
            <span lang="ja" className="font-jp font-medium">
              {kind}
            </span>
            <span className="text-xs font-semibold tabular-nums">
              <Trans>{count} missed</Trans>
            </span>
          </li>
        ))}
      </ul>
      {!trial && (
        <p className="text-caption text-muted-foreground">
          <Trans>The reading page sums them up over every set of this type.</Trans>
        </p>
      )}
    </>
  );
}
