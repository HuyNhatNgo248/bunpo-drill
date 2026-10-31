import { cn } from "~/lib/utils";

/** Kanji words to study, each with its reading: the misses of a kanji test, or the cards of a session still to learn. */
export function WordChips({ words, className }: { words: { word: string; reading: string }[]; className?: string }) {
  return (
    <ul lang="ja" className={cn("flex flex-wrap gap-1.5", className)}>
      {words.map(({ word, reading }) => (
        <li key={word} className="flex min-h-9 items-center gap-1.5 rounded-full border bg-card px-3.5 font-jp text-xs">
          <span className="font-semibold">{word}</span>
          <span className="text-muted-foreground">{reading}</span>
        </li>
      ))}
    </ul>
  );
}
