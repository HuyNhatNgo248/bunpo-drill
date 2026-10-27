import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import type { Note } from "~/lib/views";

/**
 * Notes under a question (tips, traps, ways to remember), each with who wrote it.
 * "メモを追加" opens a box to write one; the author can delete their own.
 */
export function QuestionNotes({
  testId,
  questionId,
  notes,
  userId,
}: {
  testId: string;
  questionId: string;
  notes: Note[];
  userId: number;
}) {
  const [writing, setWriting] = useState(false);
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const saving = fetcher.state !== "idle";

  // Close the box once the note is saved.
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) setWriting(false);
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      {notes.map((note) => (
        <NoteItem key={note.id} testId={testId} note={note} own={note.userId === userId} />
      ))}
      {writing ? (
        <fetcher.Form method="post" action={`/tests/${testId}/notes`} className="flex flex-col gap-2">
          <input type="hidden" name="questionId" value={questionId} />
          <textarea
            name="text"
            required
            maxLength={1000}
            rows={2}
            autoFocus
            aria-label="メモ"
            placeholder="コツ・ひっかけ・覚え方など"
            className="rounded-lg border border-input bg-card px-3 py-2 font-jp text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm"
          />
          {fetcher.data?.error && (
            <p role="alert" className="text-[13px] text-primary-soft-foreground">
              {fetcher.data.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setWriting(false)}>
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "追加中…" : "追加"}
            </Button>
          </div>
        </fetcher.Form>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setWriting(true)} className="self-start px-2">
          <MessageSquarePlus aria-hidden="true" />
          メモを追加
        </Button>
      )}
    </div>
  );
}

function NoteItem({ testId, note, own }: { testId: string; note: Note; own: boolean }) {
  const fetcher = useFetcher();
  // Hidden as soon as delete is pressed; the reload confirms it.
  if (fetcher.state !== "idle") return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-semibold text-secondary-foreground">{note.author}</span>
        <p lang="ja" className="font-jp text-sm leading-[1.7] break-words whitespace-pre-wrap">
          {note.text}
        </p>
      </div>
      {own && (
        <fetcher.Form method="delete" action={`/tests/${testId}/notes`}>
          <input type="hidden" name="noteId" value={note.id} />
          <Button type="submit" variant="ghost" size="sm" aria-label="メモを削除" className="px-2">
            <Trash2 aria-hidden="true" />
          </Button>
        </fetcher.Form>
      )}
    </div>
  );
}
