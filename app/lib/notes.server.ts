import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { orm } from "./db.server";
import { notes, tests } from "./schema.server";
import type { NoteMark, NoteView } from "./views";

/**
 * Each user's notes: words they highlighted in a test, with the sentence around them and a memo of their own, to look
 * over on the notes page. One note per text: highlighting the same words again keeps the first note.
 */

const memo = z.string().trim().max(2000);

/** A note as the test or results page sends it. */
export const newNoteSchema = z.object({
  text: z.string().trim().min(1).max(100),
  sentence: z.string().trim().max(1000),
  testId: z.string().max(64),
  /** The id of the question or passage on the test's page, to go back to it. */
  anchor: z
    .string()
    .regex(/^(question|passage)-\d+$/)
    .nullable()
    .default(null),
  memo: memo.default(""),
});

/** A memo as the notes page sends it. */
export const memoSchema = z.object({ id: z.number().int(), memo });

/** The user's notes, newest first, each with the title of the test it came from. */
export async function listNotes(userId: number): Promise<NoteView[]> {
  return (await orm())
    .select({
      id: notes.id,
      text: notes.text,
      sentence: notes.sentence,
      memo: notes.memo,
      testId: notes.testId,
      anchor: notes.anchor,
      testTitle: tests.title,
    })
    .from(notes)
    .innerJoin(tests, eq(tests.id, notes.testId))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt), desc(notes.id));
}

/** The user's notes as a test or results page highlights them; no join, so no test is read. */
export async function listNoteMarks(userId: number): Promise<NoteMark[]> {
  return (await orm()).select({ id: notes.id, text: notes.text, memo: notes.memo }).from(notes).where(eq(notes.userId, userId));
}

/** Saves a note from a test that exists; false when the user has a note on the same text already. */
export async function addNote(userId: number, note: z.input<typeof newNoteSchema>): Promise<boolean> {
  const added = await (await orm())
    .insert(notes)
    .values({ userId, ...note, createdAt: new Date().toISOString() })
    .onConflictDoNothing()
    .returning({ id: notes.id });
  return added.length > 0;
}

/** Sets the memo of one of the user's notes. */
export async function saveMemo(userId: number, id: number, text: string): Promise<void> {
  await (await orm()).update(notes).set({ memo: text }).where(and(eq(notes.id, id), eq(notes.userId, userId)));
}

/** Deletes one of the user's notes. */
export async function deleteNote(userId: number, id: number): Promise<void> {
  await (await orm()).delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
}
