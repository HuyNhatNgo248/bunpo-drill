import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { FlipCard } from "~/components/card-session/FlipCard";
import { Badge } from "~/components/ui/badge";
import { UnderlinedSentence } from "~/components/UnderlinedSentence";
import { WordChips } from "~/components/WordChips";
import type { FlashCard } from "~/lib/views";
import type { CardMode } from "./ModeTabs";

/**
 * A kanji word's card. Its front asks for the reading of the word (漢字読み) or for the word of a reading and meaning
 * (表記). Its back shows the word, its reading and meaning, the readings of its kanji, sentences with its kanji, and the
 * other words the book gives under the same kanji.
 */
export function CardFace({ card, mode, flipped, onFlip }: { card: FlashCard; mode: CardMode; flipped: boolean; onFlip: () => void }) {
  const { t } = useLingui();
  const lesson = (
    <span className="flex items-center gap-2 self-start">
      <Badge variant="soft" lang="ja" className="font-jp">
        {t`${card.lesson.title} p.${card.lesson.page}`}
      </Badge>
      {/* Missed in the last set, so it is not new. */}
      {card.repeat && <Badge variant="outline">{t`Review`}</Badge>}
    </span>
  );

  const front = (
    <>
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
    </>
  );

  const back = (
    <>
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

      {card.examples.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
          <h2 className="text-xs font-medium text-muted-foreground">
            <Trans>
              Sentences with <span lang="ja" className="font-jp">{card.headword}</span>
            </Trans>
          </h2>
          <ul className="flex flex-col gap-2.5">
            {card.examples.map(({ sentence, meaning }) => (
              <li key={sentence.before + sentence.word} className="flex flex-col gap-0.5">
                <span lang="ja" className="font-jp">
                  <UnderlinedSentence sentence={sentence} />
                </span>
                <span className="text-body-sm text-subtle-foreground">{meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
    </>
  );

  return <FlipCard flipped={flipped} onFlip={onFlip} front={front} back={back} />;
}
