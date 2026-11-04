/** A note's sentence with its words marked, or as it is when they aren't in it. */
export function MarkedSentence({ sentence, text }: { sentence: string; text: string }) {
  const at = sentence.indexOf(text);
  if (at < 0) return sentence;
  return (
    <>
      {sentence.slice(0, at)}
      <mark className="highlighter text-inherit">{text}</mark>
      {sentence.slice(at + text.length)}
    </>
  );
}
