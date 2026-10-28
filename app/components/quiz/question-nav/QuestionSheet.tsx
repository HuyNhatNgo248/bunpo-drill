import { Trans, useLingui } from "@lingui/react/macro";
import { cn } from "~/lib/utils";
import { ChevronUp, LayoutGrid } from "lucide-react";
import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { jumpTo } from "./helpers/jumpTo";
import { QuestionGrid, type QuestionListProps } from "./QuestionGrid";

/**
 * Mobile and tablet: a button in the bottom bar that opens the question list
 * as a bottom sheet. Picking a number closes the sheet and jumps there.
 */
export function QuestionSheet({
  sections,
  answered,
  remaining,
  className,
}: QuestionListProps & { remaining: number; className?: string }) {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const left = remaining;
  const done = answered.size;
  const total = done + remaining;
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
          <span className="text-subtle-foreground">· {left > 0 ? t`${left} unanswered` : t`All answered`}</span>
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
          <SheetDescription>
            <Trans>
              Answered {done} / {total}
            </Trans>
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto p-4 pb-6">
          <QuestionGrid
            sections={sections}
            answered={answered}
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
