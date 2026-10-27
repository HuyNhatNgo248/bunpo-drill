import { data } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/notes";
import { requireUserId } from "~/lib/auth.server";
import { notifyNotes } from "~/lib/live.server";
import { addNote, deleteNote, editNote } from "~/lib/tests.server";

const text = z.string().trim().min(1).max(1000);
const noteId = z.coerce.number().int();
const addSchema = z.object({ questionId: z.string().regex(/^q[0-9]+$/), text });
const editSchema = z.object({ noteId, text });
const deleteSchema = z.object({ noteId });
const TEXT_ERROR = "メモは1〜1000文字で入力してください。";

/**
 * POST /tests/:id/notes with questionId and text: add a note as the signed-in user.
 * PATCH with noteId and text: edit one of the user's own notes.
 * DELETE with noteId: delete one of the user's own notes. Pages on the test reload their notes.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const form = Object.fromEntries(await request.formData());
  if (request.method === "DELETE") {
    const parsed = deleteSchema.safeParse(form);
    if (!parsed.success) return data({ error: "メモを削除できませんでした。" }, { status: 400 });
    await deleteNote(params.id, parsed.data.noteId, userId);
  } else if (request.method === "PATCH") {
    const parsed = editSchema.safeParse(form);
    if (!parsed.success) return data({ error: TEXT_ERROR }, { status: 400 });
    await editNote(params.id, parsed.data.noteId, userId, parsed.data.text);
  } else {
    const parsed = addSchema.safeParse(form);
    if (!parsed.success) return data({ error: TEXT_ERROR }, { status: 400 });
    await addNote(params.id, parsed.data.questionId, userId, parsed.data.text);
  }
  notifyNotes(params.id);
  return { ok: true };
}
