import { Trans } from "@lingui/react/macro";
import { EmptyState } from "~/components/EmptyState";
import { AppHeader } from "~/components/layout/header";
import { SubjectTabs } from "~/components/SubjectTabs";
import type { NoteView } from "~/lib/views";
import { NoteCard } from "./NoteCard";

/** The notes page: the words the user highlighted in their tests, newest first, or how to add some. */
export function Notes({ notes }: { notes: NoteView[] }) {
  return (
    <div className="min-h-screen">
      <AppHeader account />
      <main className="mx-auto flex max-w-260 flex-col gap-4 px-4 pt-5 pb-10 md:gap-6 md:px-6 md:pt-10 md:pb-16">
        <SubjectTabs current="notes" level={null} />
        <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
          <Trans>Notes</Trans>
        </h1>
        {notes.length > 0 ? (
          <ul className="flex flex-col gap-3 md:gap-4">
            {notes.map((note) => (
              <li key={note.id}>
                <NoteCard note={note} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={<Trans>No notes yet</Trans>}>
            <Trans>Select a word or phrase in a test or its results, then choose Add to notes. It shows up here with its sentence.</Trans>
          </EmptyState>
        )}
      </main>
    </div>
  );
}
