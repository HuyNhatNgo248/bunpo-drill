import { Trans, useLingui } from "@lingui/react/macro";
import { Trash2 } from "lucide-react";
import { Link, useFetcher, useLocation } from "react-router";
import { INPUT_CLASS } from "~/components/form/styles";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { NoteView } from "~/lib/views";

/**
 * One note: the words, the sentence they came from with the words marked, the memo (saved when the field is left), a
 * link back to the question in the test they came from, and a button that deletes the note, for words the user knows now. A highlighted word links to
 * it (#note-<id>); the page scrolls to the card linked to, which screen readers hear as the current one.
 */
export function NoteCard({ note }: { note: NoteView }) {
  const { t } = useLingui();
  const fetcher = useFetcher<{ error?: string }>();
  const target = useLocation().hash === `#note-${note.id}`;
  const at = note.sentence.indexOf(note.text);
  const text = note.text;
  const testTitle = note.testTitle;
  const send = (body: { id: number; memo?: string }, method: "patch" | "delete") =>
    fetcher.submit(body, { method, action: "/notes", encType: "application/json" });

  return (
    // Hidden as soon as it is deleted; it comes back if the delete fails.
    <Card
      id={`note-${note.id}`}
      aria-current={target || undefined}
      className={cn(
        "flex scroll-mt-4 flex-col gap-2.5 p-4 md:scroll-mt-6 md:gap-3 md:p-5",
        fetcher.formMethod === "DELETE" && "hidden",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 lang="ja" className="font-jp text-xl font-bold">
          {text}
        </h2>
        <Button variant="ghost" size="sm" aria-label={t`Delete ${text}`} onClick={() => send({ id: note.id }, "delete")}>
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      {note.sentence && (
        <p lang="ja" className="font-jp text-base leading-sentence text-secondary-foreground">
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

      <label className="flex flex-col gap-1 text-caption text-muted-foreground">
        <Trans>Memo</Trans>
        <input
          defaultValue={note.memo}
          maxLength={500}
          placeholder={t`Reading or meaning`}
          className={INPUT_CLASS}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          onBlur={(event) => {
            const memo = event.currentTarget.value.trim();
            if (memo !== note.memo) send({ id: note.id, memo }, "patch");
          }}
        />
      </label>
      {fetcher.data?.error && (
        <p role="alert" className="text-caption text-primary-soft-foreground">
          <Trans>Couldn't save. Please try again.</Trans>
        </p>
      )}

      <Link to={`/tests/${note.testId}/results${note.anchor ? `#${note.anchor}` : ""}`} className="self-start text-caption text-subtle-foreground no-underline hover:text-foreground">
        <Trans>From {testTitle}</Trans>
      </Link>
    </Card>
  );
}
