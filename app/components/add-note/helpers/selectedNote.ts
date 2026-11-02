/**
 * Words picked for a note: the text selected, the sentence around it, the id of the question or passage card it is in
 * (to go back to it), and where it is on the page.
 */
export type SelectedNote = { text: string; sentence: string; anchor: string | null; range: Range };

/** A longer selection is a passage, not words to note (the server takes up to 100 characters). */
const MAX_TEXT = 100;

const SENTENCE_END = /[。！？!?\n]/g;

/** Space between two Japanese characters: the gap between sentence-order pieces, which the words don't have. */
const PIECE_GAP = /(?<=[^\x00-\x7F])\s+(?=[^\x00-\x7F])/g;

/**
 * The text selected inside one element marked `data-note-sentence`, with the sentence around it taken from that
 * attribute; null when nothing is selected, or the selection is not inside one marked element.
 */
export function selectedNote(selection: Selection | null): SelectedNote | null {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  // The ★ marks a sentence-order slot; it isn't part of the words.
  const text = selection.toString().replaceAll("★", "").replace(PIECE_GAP, "").trim();
  if (!text || text.length > MAX_TEXT) return null;
  const range = selection.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const marked = (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>("[data-note-sentence]");
  const context = marked?.dataset.noteSentence;
  if (!marked || context === undefined) return null;
  const anchor = marked.closest('[id^="question-"], [id^="passage-"]')?.id ?? null;
  return { text, sentence: sentenceAround(context, text), anchor, range: range.cloneRange() };
}

/** The sentence of `context` that holds `text` (a passage has many), or all of `context` when `text` isn't in it. */
function sentenceAround(context: string, text: string): string {
  const at = context.indexOf(text);
  if (at < 0) return context;
  const start = Math.max(0, ...[...context.slice(0, at).matchAll(SENTENCE_END)].map((end) => end.index + 1));
  const rest = context.slice(at + text.length).search(SENTENCE_END);
  return context.slice(start, rest < 0 ? undefined : at + text.length + rest + 1).trim();
}
