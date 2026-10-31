import { Plural, Trans } from "@lingui/react/macro";
import { Layers } from "lucide-react";
import { Link } from "react-router";
import { GrammarChips } from "~/components/grammar-chips";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { WordChips } from "~/components/WordChips";
import { cardsOf } from "~/lib/links";
import type { ResultsView } from "~/lib/views";

/** What to review: the grammar of the wrong answers, or on a kanji test their words, with the way to their flashcards. */
export function ReviewCard({ results }: { results: ResultsView }) {
  return (
    <Card className="flex flex-col gap-3.5 p-4 md:gap-4 md:p-6">
      <h2 className="text-base font-semibold md:text-lg">
        {results.kind === "kanji" ? <Trans>Words to study</Trans> : <Trans>Grammar worth reviewing</Trans>}
      </h2>
      {results.kind === "kanji" && results.chapter !== null && results.words.length > 0 ? (
        <WordsToStudy results={results} chapter={results.chapter} />
      ) : results.review.length > 0 ? (
        <GrammarChips testId={results.id} chips={results.review} />
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
        <Link to={cardsOf(results.level, chapter, results.words.map((word) => word.wordId))}>
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
