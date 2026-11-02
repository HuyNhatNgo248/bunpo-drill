import { Trans, useLingui } from "@lingui/react/macro";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useFetcher, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { NoteView } from "~/lib/views";
import { Memo } from "./Memo";

/**
 * One note, compact: the words, the memo in Markdown (what is reviewed), the sentence they came from with the words
 * marked, and a link back to the question in the test they came from; buttons edit the memo and delete the note, for
 * words the user knows now. A highlighted word links to it (#note-<id>); the page scrolls to the card linked to, which
 * blushes faint red and fades back, and which screen readers hear as the current one.
 */
export function NoteCard({ note }: { note: NoteView }) {
  const { t } = useLingui();
  const fetcher = useFetcher<{ error?: string }>();
  const [editing, setEditing] = useState(false);
  const target = useLocation().hash === `#note-${note.id}`;
  const at = note.sentence.indexOf(note.text);
  const text = note.text;
  const testTitle = note.testTitle;
  const send = (body: { id: number; memo?: string }, method: "patch" | "delete") =>
    fetcher.submit(body, { method, action: "/notes", encType: "application/json" });
  // A memo being saved shows at once, before the notes load again.
  const memo = (fetcher.json as { memo?: string } | undefined)?.memo ?? note.memo;

  return (
    // Hidden as soon as it is deleted; it comes back if the delete fails.
    <Card
      id={`note-${note.id}`}
      aria-current={target || undefined}
      className={cn(
        "flex h-full scroll-mt-4 flex-col gap-1.5 p-3.5 md:scroll-mt-6 md:p-4",
        target && "animate-arrived motion-reduce:animate-none",
        fetcher.formMethod === "DELETE" && "hidden",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 lang="ja" className="font-jp text-lg font-bold">
          {text}
        </h2>
        <div className="-mt-1 -mr-1.5 flex">
          {memo && !editing && (
            <Button variant="ghost" size="sm" aria-label={t`Edit the memo of ${text}`} onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" />
            </Button>
          )}
          <Button variant="ghost" size="sm" aria-label={t`Delete ${text}`} onClick={() => send({ id: note.id }, "delete")}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Memo
        memo={memo}
        text={text}
        editing={editing}
        onEdit={() => setEditing(true)}
        onClose={(next) => {
          if (next !== memo) send({ id: note.id, memo: next }, "patch");
          setEditing(false);
        }}
      />
      {fetcher.data?.error && (
        <p role="alert" className="text-caption text-primary-soft-foreground">
          <Trans>Couldn't save. Please try again.</Trans>
        </p>
      )}

      {note.sentence && (
        <p lang="ja" className="font-jp text-body-sm text-secondary-foreground">
          {at < 0 ? (
            note.sentence
          ) : (
            <>
              {note.sentence.slice(0, at)}
              <mark className="highlighter text-inherit">{text}</mark>
              {note.sentence.slice(at + text.length)}
            </>
          )}
        </p>
      )}

      <Link
        to={`/tests/${note.testId}/results${note.anchor ? `#${note.anchor}` : ""}`}
        className="mt-auto self-start pt-0.5 text-caption text-subtle-foreground no-underline transition-colors hover:text-indigo"
      >
        <Trans>From {testTitle}</Trans>
      </Link>
    </Card>
  );
}
