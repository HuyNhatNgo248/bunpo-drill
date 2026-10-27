import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { useFetcher, type FetcherWithComponents } from "react-router";
import breaks from "remark-breaks";
import { Button } from "~/components/ui/button";
import type { Note } from "~/lib/views";

type NoteFetcher = FetcherWithComponents<{ ok?: boolean; error?: string }>;

// The typography plugin's styles, tightened for a small note; code and quotes drop the plugin's added marks.
const MARKDOWN =
  "prose prose-sm max-w-none font-jp leading-[1.7] break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-blockquote:my-1 prose-blockquote:font-normal prose-blockquote:not-italic [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none prose-code:rounded prose-code:bg-card prose-code:px-1 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none";

/**
 * Notes under a question (tips, traps, ways to remember), each with who wrote it.
 * "メモを追加" opens a box to write one; authors can edit and delete their own.
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
  const fetcher: NoteFetcher = useFetcher();
  useCloseWhenSaved(fetcher, () => setWriting(false));

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      {notes.map((note) => (
        <NoteItem key={note.id} testId={testId} note={note} own={note.userId === userId} />
      ))}
      {writing ? (
        <NoteForm fetcher={fetcher} method="post" action={`/tests/${testId}/notes`} label="追加" onCancel={() => setWriting(false)}>
          <input type="hidden" name="questionId" value={questionId} />
        </NoteForm>
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
  const [editing, setEditing] = useState(false);
  const edit: NoteFetcher = useFetcher();
  const remove = useFetcher();
  useCloseWhenSaved(edit, () => setEditing(false));
  const action = `/tests/${testId}/notes`;

  // Hidden as soon as delete is pressed; the reload confirms it.
  if (remove.state !== "idle") return null;
  if (editing) {
    return (
      <NoteForm fetcher={edit} method="patch" action={action} label="保存" text={note.text} onCancel={() => setEditing(false)}>
        <input type="hidden" name="noteId" value={note.id} />
      </NoteForm>
    );
  }
  return (
    <div className="flex items-start gap-1 rounded-lg bg-muted py-2 pr-1 pl-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-semibold text-secondary-foreground">{note.author}</span>
        <div lang="ja" className={MARKDOWN}>
          {/* react-markdown drops raw HTML and javascript: links; images are left out too, and links open in a new tab. */}
          <Markdown
            remarkPlugins={[breaks]}
            disallowedElements={["img"]}
            unwrapDisallowed
            components={{ a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" /> }}
          >
            {note.text}
          </Markdown>
        </div>
      </div>
      {own && (
        <>
          <Button type="button" variant="ghost" size="sm" aria-label="メモを編集" onClick={() => setEditing(true)} className="px-2">
            <Pencil aria-hidden="true" />
          </Button>
          <remove.Form method="delete" action={action}>
            <input type="hidden" name="noteId" value={note.id} />
            <Button type="submit" variant="ghost" size="sm" aria-label="メモを削除" className="px-2">
              <Trash2 aria-hidden="true" />
            </Button>
          </remove.Form>
        </>
      )}
    </div>
  );
}

/** The box for writing a note: new (no `text`) or editing one. */
function NoteForm({
  fetcher,
  method,
  action,
  label,
  text,
  onCancel,
  children,
}: {
  fetcher: NoteFetcher;
  method: "post" | "patch";
  action: string;
  label: string;
  text?: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const saving = fetcher.state !== "idle";
  return (
    <fetcher.Form method={method} action={action} className="flex flex-col gap-2">
      {children}
      <textarea
        name="text"
        required
        maxLength={1000}
        rows={3}
        autoFocus
        defaultValue={text}
        aria-label="メモ"
        placeholder="コツ・ひっかけ・覚え方など（Markdown 可）"
        className="rounded-lg border border-input bg-card px-3 py-2 font-jp text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm"
      />
      {fetcher.data?.error && (
        <p role="alert" className="text-[13px] text-primary-soft-foreground">
          {fetcher.data.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? `${label}中…` : label}
        </Button>
      </div>
    </fetcher.Form>
  );
}

/** Calls `close` once the fetcher's note is saved. */
function useCloseWhenSaved(fetcher: NoteFetcher, close: () => void) {
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) close();
  }, [fetcher.state, fetcher.data]);
}
