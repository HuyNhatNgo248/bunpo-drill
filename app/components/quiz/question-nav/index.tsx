import { cn } from "cn";
import { ChevronUp, LayoutGrid } from "lucide-react";
import { useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { questionAnchor, SECTION_TITLES } from "~/lib/sections";
import type { QuizSection } from "~/lib/views";

type Props = { sections: QuizSection[]; answered: Set<string> };

/** Desktop sidebar: the question list, sticky below the progress bar. */
export function QuestionNav({
  sections,
  answered,
  className,
}: Props & { className?: string }) {
  return (
    <nav
      aria-label="問題一覧"
      className={cn(
        "flex max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4",
        className,
      )}
    >
      <QuestionGrid sections={sections} answered={answered} onPick={jumpTo} />
    </nav>
  );
}

/**
 * Mobile and tablet: a button in the bottom bar that opens the question list
 * as a bottom sheet. Picking a number closes the sheet and jumps there.
 */
export function QuestionSheet({
  sections,
  answered,
  remaining,
  className,
}: Props & { remaining: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const target = useRef<number | null>(null);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-lg border bg-card px-3 text-left text-[13px] outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 md:h-10 md:w-auto md:text-sm",
            className,
          )}
        >
          <LayoutGrid
            className="size-4 text-subtle-foreground"
            aria-hidden="true"
          />
          <span className="font-medium">問題一覧</span>
          <span className="text-subtle-foreground">
            · {remaining > 0 ? `未回答 ${remaining}問` : "すべて回答済み"}
          </span>
          <ChevronUp
            className="ml-auto size-4 text-subtle-foreground md:ml-1"
            aria-hidden="true"
          />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 rounded-t-2xl"
        // The sheet has closed and released the scroll lock: jump now instead of refocusing the button.
        onCloseAutoFocus={(event) => {
          if (target.current === null) return;
          event.preventDefault();
          jumpTo(target.current);
          target.current = null;
        }}
      >
        <SheetHeader className="border-b pr-14">
          <SheetTitle>問題一覧</SheetTitle>
          <SheetDescription>
            回答済み {answered.size} / {answered.size + remaining}
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

function jumpTo(num: number) {
  const card = document.getElementById(questionAnchor(num));
  if (!card) return;
  // Jump instantly: a smooth scroll across 45 questions takes over a second.
  card.scrollIntoView({ behavior: "instant", block: "start" });
  card.focus({ preventScroll: true });
}

/** Question numbers grouped by section, filled red once answered. */
function QuestionGrid({
  sections,
  answered,
  onPick,
  touch = false,
}: Props & { onPick: (num: number) => void; touch?: boolean }) {
  return (
    <>
      {sections.map((section) => {
        const questions = section.groups.flatMap((group) => group.questions);
        return (
          <div key={section.no} className="flex flex-col gap-2">
            <div
              lang="ja"
              className="flex items-baseline gap-1.5 font-jp text-xs"
            >
              <span className="font-bold">問題{section.no}</span>
              <span className="truncate text-muted-foreground">
                {SECTION_TITLES[section.type]}
              </span>
            </div>
            <ol
              className={cn(
                "grid gap-1.5",
                touch
                  ? "grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2"
                  : "grid-cols-5",
              )}
            >
              {questions.map((question) => {
                const done = answered.has(question.id);
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      onClick={() => onPick(question.num)}
                      aria-label={`問題${question.num}（${done ? "回答済み" : "未回答"}）`}
                      className={cn(
                        "flex w-full items-center justify-center rounded-md border font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        touch ? "h-11 text-sm" : "h-8 text-xs",
                        done
                          ? "border-primary bg-primary text-primary-foreground hover:bg-primary-hover"
                          : "border-border bg-card text-subtle-foreground hover:bg-muted",
                      )}
                    >
                      {question.num}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}

      <div
        aria-hidden="true"
        className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary" />
          回答済み
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-border bg-card" />
          未回答
        </span>
      </div>
    </>
  );
}
