import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { NoteView } from "~/lib/views";
import { NotedWord } from "./NotedWord";

type Marks = { pattern: RegExp; byText: Map<string, NoteView> } | null;

const NotesContext = createContext<Marks>(null);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Gives the user's notes to each NotedText inside, which highlights their words. */
export function NotesProvider({ notes, children }: { notes: NoteView[]; children: ReactNode }) {
  const marks = useMemo(() => {
    if (notes.length === 0) return null;
    // Longest first, so a note on 考えた末 wins over one on 末.
    const texts = notes.map((note) => note.text).sort((a, b) => b.length - a.length);
    return { pattern: new RegExp(`(${texts.map(escape).join("|")})`), byText: new Map(notes.map((note) => [note.text, note])) };
  }, [notes]);
  return <NotesContext value={marks}>{children}</NotesContext>;
}

/**
 * `text` with each word of the user's notes highlighted, as a button that shows the note. Outside a NotesProvider (a
 * trial test, the flashcards), or with no notes, it is the text alone. Words that run across two texts are not found.
 */
export function NotedText({ text }: { text: string }) {
  const marks = useContext(NotesContext);
  if (!marks) return text;
  // The pattern captures, so the words of notes are the odd parts.
  return text.split(marks.pattern).map((part, i) => (i % 2 === 1 ? <NotedWord key={i} note={marks.byText.get(part)!} /> : part));
}
