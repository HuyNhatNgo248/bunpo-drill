import { msg } from "@lingui/core/macro";
import { useLocation } from "react-router";
import type { Route } from "./+types/note-cards";
import { NoteCards } from "~/components/note-cards";
import { requireUserId } from "~/lib/auth.server";
import { localeFromMatches, translate } from "~/lib/i18n";
import { listNotes } from "~/lib/notes.server";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: `${translate(localeFromMatches(matches), msg`Note cards`)} · 文法ドリル` }];
}

/** The notes with a memo: a note without one has nothing on the back of its card. */
export async function loader({ request }: Route.LoaderArgs) {
  const notes = await listNotes(await requireUserId(request));
  return { notes: notes.filter((note) => note.memo) };
}

export default function NoteCardsRoute({ loaderData }: Route.ComponentProps) {
  // Each visit is a new session.
  return <NoteCards key={useLocation().key} notes={loaderData.notes} />;
}
