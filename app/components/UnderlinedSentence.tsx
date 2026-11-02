import { NotedText } from "~/components/noted-text";
import type { Underlined } from "~/lib/views";

/**
 * A kanji question's sentence with its word underlined, as the exam prints it. A screen reader hears the word in 「」,
 * since it can't hear the line.
 */
export function UnderlinedSentence({ sentence: { before, word, after } }: { sentence: Underlined }) {
  return (
    <>
      <NotedText text={before} />
      <u className="underline decoration-1 underline-offset-6">
        <span className="sr-only">「</span>
        <NotedText text={word} />
        <span className="sr-only">」</span>
      </u>
      <NotedText text={after} />
    </>
  );
}
