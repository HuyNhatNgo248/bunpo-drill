import { afterEach, describe, expect, it } from "vitest";
import { selectedNote } from "./selectedNote";

const PASSAGE = "私は毎日練習した。そのかいがあって、合格できた。来年はN1を受ける。";

/** Puts `html` on the page and selects the first `text` in it, inside one text node. */
function select(html: string, text: string): Selection {
  document.body.innerHTML = html;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent?.includes(text)) node = walker.nextNode();
  const at = node!.textContent!.indexOf(text);
  const range = document.createRange();
  range.setStart(node!, at);
  range.setEnd(node!, at + text.length);
  const selection = document.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  return selection;
}

afterEach(() => {
  document.getSelection()?.removeAllRanges();
  document.body.innerHTML = "";
});

describe("selectedNote", () => {
  it("gives the words selected, with the sentence of the passage that holds them", () => {
    const html = `<p data-note-sentence="${PASSAGE}"><span>${PASSAGE}</span></p>`;

    expect(selectedNote(select(html, "かいがあって"))).toMatchObject({ text: "かいがあって", sentence: "そのかいがあって、合格できた。" });
    expect(selectedNote(select(html, "毎日"))?.sentence).toBe("私は毎日練習した。");
    expect(selectedNote(select(html, "N1を受ける"))?.sentence).toBe("来年はN1を受ける。");
  });

  it("gives the id of the question or passage card the words are in, to go back to it", () => {
    const sentence = `<p data-note-sentence="${PASSAGE}">${PASSAGE}</p>`;

    expect(selectedNote(select(`<div id="question-14">${sentence}</div>`, "毎日"))?.anchor).toBe("question-14");
    expect(selectedNote(select(`<div id="passage-41">${sentence}</div>`, "毎日"))?.anchor).toBe("passage-41");
    expect(selectedNote(select(`<div id="other">${sentence}</div>`, "毎日"))?.anchor).toBeNull();
  });

  it("leaves out a sentence-order slot's ★ and the gaps between the pieces, and keeps the spaces of English", () => {
    document.body.innerHTML = `<p data-note-sentence="彼は……合格した。"><span>毎日</span> <span>★ かいが</span> <span>あって</span></p>`;
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("p")!);
    document.getSelection()!.addRange(range);

    expect(selectedNote(document.getSelection())?.text).toBe("毎日かいがあって");
    expect(selectedNote(select(`<p data-note-sentence="末 takes a past verb.">末 takes a past verb.</p>`, "末 takes a"))?.text).toBe("末 takes a");
  });

  it("gives the whole marked text when the words are not in it as selected, as across a blank's answer", () => {
    const html = `<p data-note-sentence="練習した（　）合格できた。"><span>練習した（かいがあって）合格できた。</span></p>`;

    expect(selectedNote(select(html, "た（かい"))).toMatchObject({ text: "た（かい", sentence: "練習した（　）合格できた。" });
  });

  it("gives nothing outside a marked element, or for a selection that is empty or a whole passage", () => {
    expect(selectedNote(select(`<p>${PASSAGE}</p>`, "毎日"))).toBeNull();
    expect(selectedNote(select(`<p data-note-sentence="x">${"長".repeat(101)}</p>`, "長".repeat(101)))).toBeNull();
    document.getSelection()?.removeAllRanges();
    expect(selectedNote(document.getSelection())).toBeNull();
  });
});
