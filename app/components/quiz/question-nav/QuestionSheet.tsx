import { Trans } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { ChevronUp, LayoutGrid } from "lucide-react";
import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { jumpTo } from "./helpers/jumpTo";
import { QuestionGrid, type QuestionListProps } from "./QuestionGrid";

/**
 * Mobile and tablet: a button in the bottom bar that opens the question list as a bottom sheet, in the quiz
 * and in the results. Picking a number closes the sheet and jumps there.
 */
export function QuestionSheet({
  sections,
  markOf,
  marks,
  status,
  summary,
  className,
}: QuestionListProps & {
  /** After "Question list" on the button, e.g. "2 unanswered". */
  status: string;
  /** Under the sheet's title, e.g. "Answered 1 / 3". */
  summary: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const target = useRef<number | null>(null);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-lg border bg-card px-3 text-left text-caption outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 md:h-10 md:w-auto md:text-sm",
            className,
          )}
        >
          <LayoutGrid className="size-4 text-subtle-foreground" aria-hidden="true" />
          <span className="font-medium">
            <Trans>Question list</Trans>
          </span>
          <span className="text-subtle-foreground">· {status}</span>
          <ChevronUp className="ml-auto size-4 text-subtle-foreground md:ml-1" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-sheet gap-0 rounded-t-2xl"
        // The sheet has closed and released the scroll lock: jump now instead of refocusing the button.
        onCloseAutoFocus={(event) => {
          if (target.current === null) return;
          event.preventDefault();
          jumpTo(target.current);
          target.current = null;
        }}
      >
        <SheetHeader className="border-b pr-14">
          <SheetTitle>
            <Trans>Question list</Trans>
          </SheetTitle>
          <SheetDescription>{summary}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto p-4 pb-6">
          <QuestionGrid
            sections={sections}
            markOf={markOf}
            marks={marks}
            onPick={(num) => {
              target.current = num;
              setOpen(false);
            }}
            touch
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
