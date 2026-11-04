import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { CardControls } from "~/components/flashcards/CardControls";
import { useSession } from "~/components/flashcards/hooks/useSession";
import { Markdown } from "~/components/Markdown";
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
  const { current, total, done } = session;
  const percent = total === 0 ? 100 : (done / total) * 100;
  const position = `${Math.min(session.position, total)} / ${total}`;
  const again = session.missed.length;
  const gotIt = session.firstTry;

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
        <ProgressCard percent={percent} label={t`Cards done`}>
          <Trans>
            Cards done {done} / {total}
          </Trans>
        </ProgressCard>

        {current ? (
          <>
            <NoteFace key={current.wordId} note={current} flipped={session.flipped} onFlip={session.flip} />
            <CardControls session={session} />
          </>
        ) : (
          <>
            <Card className="flex flex-col gap-0.5 p-4 md:p-6">
              <h2 className="text-xl font-bold tracking-tight">
                <Trans>Session done</Trans>
              </h2>
              <p className="text-caption text-muted-foreground">
                <Plural value={total} one="# card" other="# cards" />
                {" · "}
                <Trans>{gotIt} got it first time</Trans>
                {" · "}
                <Trans>{again} needed again</Trans>
              </p>
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

  if (!flipped) {
    return (
      <button
        type="button"
        onClick={onFlip}
        className="flex h-112 flex-col items-center justify-center gap-4 rounded-xl border bg-card p-4 text-center shadow-raised outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:h-120 md:p-6"
      >
        {words}
        {sentence}
        <span className="mt-2 text-caption text-muted-foreground">
          <Trans>Recall your memo, then flip the card.</Trans>
        </span>
      </button>
    );
  }

  return (
    // A tap anywhere on the back turns the card face up again, and still lets a long memo scroll.
    <Card
      aria-label={t`Answer`}
      onClick={onFlip}
      className="relative flex h-112 cursor-pointer flex-col items-center gap-4 overflow-y-auto p-4 text-center shadow-raised md:h-120 md:p-6"
    >
      {words}
      <div className="w-full border-t pt-3.5 text-left">
        <Markdown text={note.memo} />
      </div>
      {sentence}
      <span className="mt-auto text-caption text-subtle-foreground">{t`From ${testTitle}`}</span>
      {/* For the keyboard and screen readers; its click reaches the card's. Shown only when it has focus. */}
      <button
        type="button"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:right-3 focus-visible:rounded-md focus-visible:bg-card focus-visible:px-2 focus-visible:py-1 focus-visible:text-caption focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {t`Show the question`}
      </button>
    </Card>
  );
}
