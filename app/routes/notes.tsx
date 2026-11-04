import { msg } from "@lingui/core/macro";
import { data } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/notes";
import { Notes } from "~/components/notes";
import { requireUserId } from "~/lib/auth.server";
import { titleMeta } from "~/lib/i18n";
import { addNote, deleteNote, listNotes, memoSchema, newNoteSchema, saveMemo } from "~/lib/notes.server";
import { getTest } from "~/lib/tests.server";
import { lastTabOf } from "~/lib/users.server";

export const meta = titleMeta(msg`Notes`);

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const [notes, last] = await Promise.all([listNotes(userId), lastTabOf(userId)]);
  // The level last opened, for the tabs: with none, the grammar tab's / would open the last tab instead, kanji included.
  return { notes, level: last?.level ?? null };
}

/**
 * POST {"text", "sentence", "testId", "anchor"?, "memo"?} adds a note, from a test or its results; PATCH {"id", "memo"} sets a
 * note's memo; DELETE {"id"} deletes a note.
 */
export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const json = await request.json().catch(() => null);
  if (request.method === "PATCH") {
    const body = memoSchema.safeParse(json);
    if (!body.success) return data({ error: 'Body must be {"id": number, "memo": string}.' }, { status: 400 });
    await saveMemo(userId, body.data.id, body.data.memo);
    return { saved: body.data.id };
  }
  if (request.method === "DELETE") {
    const body = z.object({ id: z.number().int() }).safeParse(json);
    if (!body.success) return data({ error: 'Body must be {"id": number}.' }, { status: 400 });
    await deleteNote(userId, body.data.id);
    return { deleted: body.data.id };
  }
  const body = newNoteSchema.safeParse(json);
  if (!body.success || !(await getTest(body.data.testId, userId))) {
    return data({ error: 'Body must be {"text", "sentence", "testId", "memo"?} of a test that exists.' }, { status: 400 });
  }
  return { added: await addNote(userId, body.data) };
}

export default function NotesRoute({ loaderData }: Route.ComponentProps) {
  return <Notes notes={loaderData.notes} />;
}
