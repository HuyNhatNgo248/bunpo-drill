import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { CardControls } from "~/components/card-session/CardControls";
import { FlipCard } from "~/components/card-session/FlipCard";
import { useSession } from "~/components/card-session/hooks/useSession";
import { SessionSummary } from "~/components/card-session/SessionSummary";
import { Markdown } from "~/components/Markdown";
import { EmptyState } from "~/components/EmptyState";
import { MarkedSentence } from "~/components/notes/MarkedSentence";
import { PageTitle } from "~/components/PageTitle";
import { ProgressCard } from "~/components/ProgressCard";
import { ProgressHeader } from "~/components/ProgressHeader";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import type { NoteView } from "~/lib/views";

/**
 * The notes with a memo as flashcards: the words and their sentence on the front, the memo on the back, rated Again or
 * Got it as the kanji cards are. Nothing is saved; each visit studies every note.
 */
export function NoteCards({ notes }: { notes: NoteView[] }) {
  const { t } = useLingui();
  // The session keys its cards by `wordId`.
  const session = useSession(
    notes.map((note) => ({ ...note, wordId: String(note.id) })),
    false,
  );
  const { current, total, done, percent, position } = session;
  const again = session.missed.length;

  return (
    <div className="min-h-screen">
      <ProgressHeader
        title={t`Note cards`}
        count={position}
        percent={percent}
        label={t`Cards done`}
        back={{ to: "/notes", label: t`Back to notes` }}
      />

      <main className="mx-auto flex max-w-205 flex-col gap-3.5 px-4 pt-4 pb-8 md:gap-5 md:px-6 md:pt-8 md:pb-16">
        <PageTitle meta={position} back={{ to: "/notes", label: <Trans>← Notes</Trans> }}>
          <Trans>Note cards</Trans>
        </PageTitle>
        {notes.length > 0 && (
          <ProgressCard percent={percent} label={t`Cards done`}>
            <Trans>
              Cards done {done} / {total}
            </Trans>
          </ProgressCard>
        )}

        {notes.length === 0 ? (
          <EmptyState title={<Trans>No notes with a memo yet</Trans>}>
            <Trans>Add a memo to a note, and it shows up here as a card.</Trans>
          </EmptyState>
        ) : current ? (
          <>
            <NoteFace key={current.wordId} note={current} flipped={session.flipped} onFlip={session.flip} />
            <CardControls session={session} />
          </>
        ) : (
          <>
            <Card className="p-4 md:p-6">
              <SessionSummary total={total} gotIt={session.firstTry} again={again} />
            </Card>
            <div className="flex flex-col gap-2">
              {again > 0 && (
                <Button size="lg" onClick={session.studyAgain} className="font-semibold">
                  <Plural value={again} one="Study it again" other="Study the # again" />
                </Button>
              )}
              <Button asChild variant="ghost" size="lg">
                <Link to="/notes">
                  <Trans>Back to notes</Trans>
                </Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/** A note's card: its words and sentence face up; a tap turns it to the memo, and back. One height either way. */
function NoteFace({ note, flipped, onFlip }: { note: NoteView; flipped: boolean; onFlip: () => void }) {
  const { t } = useLingui();
  const testTitle = note.testTitle;
  const words = (
    <span lang="ja" className="font-jp text-4xl font-semibold tracking-wider md:text-5xl">
      {note.text}
    </span>
  );
  const sentence = note.sentence && (
    <span lang="ja" className="font-jp text-body-sm text-secondary-foreground">
      <MarkedSentence sentence={note.sentence} text={note.text} />
    </span>
  );

  return (
    <FlipCard
      flipped={flipped}
      onFlip={onFlip}
      className="items-center text-center"
      front={
        <span className="flex flex-1 flex-col items-center justify-center gap-4">
          {words}
          {sentence}
          <span className="mt-2 text-caption text-muted-foreground">
            <Trans>Recall your memo, then flip the card.</Trans>
          </span>
        </span>
      }
      back={
        <>
          {words}
          {/* Centred as a block, like the rest of the card; its lines (a list, say) still start on the left. */}
          <div className="w-full border-t pt-3.5">
            <div className="mx-auto w-fit text-left">
              <Markdown text={note.memo} />
            </div>
          </div>
          {sentence}
          <span className="mt-auto text-caption text-subtle-foreground">{t`From ${testTitle}`}</span>
        </>
      }
    />
  );
}
