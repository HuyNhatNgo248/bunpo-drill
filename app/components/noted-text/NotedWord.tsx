import { Trans, useLingui } from "@lingui/react/macro";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import type { NoteView } from "~/lib/views";

/** A word of the user's notes, highlighted in a sentence; a click shows its memo and the way to it on the notes page. */
export function NotedWord({ note }: { note: NoteView }) {
  const { t } = useLingui();
  return (
    <Popover>
      <PopoverTrigger className="highlighter cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
        {note.text}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <p lang="ja" className="font-jp text-base font-semibold">
          {note.text}
        </p>
        <p className={cn("whitespace-pre-wrap", !note.memo && "text-muted-foreground")}>{note.memo || t`No memo yet.`}</p>
        <Link
          to={`/notes#note-${note.id}`}
          className="inline-flex items-center gap-1 self-start text-caption font-medium text-indigo underline-offset-4 hover:underline"
        >
          <Trans>Open in notes</Trans>
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
