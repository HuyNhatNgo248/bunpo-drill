import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { WordChips } from "~/components/WordChips";
import type { FlashCard } from "~/lib/views";
import type { CardMode } from "./ModeTabs";

/**
 * The card on the table. Its front asks for the reading of the word (漢字読み) or for the word of a reading and meaning
 * (表記); a tap flips it over, and back. Its back shows the word, its reading and meaning, the readings of its kanji,
 * and the other words the book gives under the same kanji.
 */
export function CardFace({ card, mode, flipped, onFlip }: { card: FlashCard; mode: CardMode; flipped: boolean; onFlip: () => void }) {
  const { t } = useLingui();
  const lesson = (
    <Badge variant="soft" lang="ja" className="self-start font-jp">
      {t`${card.lesson.title} p.${card.lesson.page}`}
    </Badge>
  );

  if (!flipped) {
    return (
      <button
        type="button"
        onClick={onFlip}
        className="flex min-h-80 flex-col rounded-xl border bg-card p-4 text-left shadow-raised outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:min-h-96 md:p-6"
      >
        {lesson}
        <span className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          {mode === "kanji-reading" ? (
            <span lang="ja" className="font-jp text-5xl font-semibold tracking-wider md:text-6xl">
              {card.word}
            </span>
          ) : (
            <>
              <span lang="ja" className="font-jp text-3xl font-semibold md:text-4xl">
                {card.reading}
              </span>
              <span className="text-base text-subtle-foreground">{card.meaning}</span>
            </>
          )}
          <span className="mt-2 text-caption text-muted-foreground">
            {mode === "kanji-reading" ? <Trans>Say the reading, then flip the card.</Trans> : <Trans>Picture the kanji, then flip the card.</Trans>}
          </span>
        </span>
      </button>
    );
  }

  return (
    <Card aria-label={t`Answer`} className="relative flex flex-col gap-4 p-4 shadow-raised md:p-6">
      {lesson}
      <div className="flex flex-col items-center gap-1 text-center">
        <span lang="ja" className="font-jp text-4xl font-semibold tracking-wider">
          {card.word}
        </span>
        <span lang="ja" className="font-jp text-2xl font-semibold text-indigo">
          {card.reading}
        </span>
        <span className="text-body-sm text-subtle-foreground">{card.meaning}</span>
      </div>

      <div className="flex flex-col gap-2.5 border-t pt-3.5">
        <h2 className="text-xs font-medium text-muted-foreground">
          <Trans>Kanji in this word</Trans>
        </h2>
        <ul className="flex flex-col gap-2.5">
          {card.kanji.map(({ char, kun, on, strokes }) => (
            <li key={char} className="flex items-center gap-3">
              <span lang="ja" className="flex size-11 flex-none items-center justify-center rounded-md bg-muted font-jp text-2xl font-semibold">
                {char}
              </span>
              <dl className="grid flex-1 grid-cols-term items-baseline gap-x-3 gap-y-0.5">
                <dt className="text-xs text-muted-foreground">
                  <Trans>kun</Trans>
                </dt>
                <dd lang="ja" className="font-jp">
                  {kun.join("・") || "—"}
                </dd>
                <dt className="text-xs text-muted-foreground">
                  <Trans>on</Trans>
                </dt>
                <dd lang="ja" className="font-jp">
                  {on.join("・") || "—"}
                </dd>
              </dl>
              {strokes !== null && (
                <span className="text-xs text-muted-foreground">
                  <Plural value={strokes} one="# stroke" other="# strokes" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {card.related.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">
            <Trans>
              More words with <span lang="ja" className="font-jp">{card.headword}</span>
            </Trans>
          </h2>
          <WordChips words={card.related} />
        </div>
      )}
      {/* Over the whole back, so a tap anywhere turns the card face up again. */}
      <button
        type="button"
        onClick={onFlip}
        aria-label={t`Show the question`}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      />
    </Card>
  );
}
