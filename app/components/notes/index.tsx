import { Trans } from "@lingui/react/macro";
import { Link } from "react-router";
import { EmptyState } from "~/components/EmptyState";
import { useTabLoading } from "~/components/SubjectTabs";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { NoteView } from "~/lib/views";
import { NoteCard } from "./NoteCard";

/** The notes page: the words the user highlighted in their tests, newest first, or how to add some. */
export function Notes({ notes }: { notes: NoteView[] }) {
  // Another tab is loading: this page fades, so the click shows at once.
  const switching = useTabLoading();
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-title-lg">
          <Trans>Notes</Trans>
        </h1>
        {/* Only notes with a memo have a back to their card. */}
        {notes.some((note) => note.memo) && (
          <Button asChild variant="outline" size="sm">
            <Link to="/notes/cards">
              <Trans>Study as flashcards</Trans>
            </Link>
          </Button>
        )}
      </div>
      <div aria-busy={switching} className={cn("transition-opacity duration-200", switching && "opacity-50")}>
        {notes.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
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
      </div>
    </>
  );
}
