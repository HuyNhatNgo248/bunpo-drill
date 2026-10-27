import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { ChevronDown, GripVertical } from "lucide-react";
import { useState } from "react";
import { Form, Link } from "react-router";
import { GrammarChips } from "~/components/grammar-chips";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { TestSummary } from "~/lib/views";
import { DeleteTest } from "./DeleteTest";

/** One test: its handle to drag, its title and last score, and its buttons. 復習 opens its grammar chips. */
export function TestRow({ test }: { test: TestSummary }) {
  const [open, setOpen] = useState(false);
  const sortable = useSortable({ id: test.id, attributes: { roleDescription: "並べ替え可能" } });
  const quizHref = `/tests/${test.id}`;
  const weeks = test.weeks.map((week) => `第${week}週`).join("・");

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:p-5 md:last:border-b-0",
        sortable.isDragging && "relative z-10 shadow-float hover:bg-card",
      )}
    >
      {/* Drag by this handle only, so the rest of the row still scrolls, opens the test and works its buttons. */}
      <button
        type="button"
        ref={sortable.setActivatorNodeRef}
        {...sortable.attributes}
        {...sortable.listeners}
        aria-label={`「${test.title}」を並べ替え`}
        className="-my-0.5 -ml-2 flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-faint outline-none hover:text-subtle-foreground focus-visible:ring-3 focus-visible:ring-ring/40 active:cursor-grabbing md:-ml-3 md:h-10"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>

      <Link
        to={test.result ? `${quizHref}/results` : quizHref}
        className="flex min-w-0 flex-1 flex-col gap-1 text-foreground no-underline md:flex-[999_1_380px] md:gap-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft" className="text-[11px] md:text-xs">
            {test.level}
          </Badge>
          <span className="text-base font-semibold">{test.title}</span>
          {test.result && (
            <Badge variant="outline">
              {test.result.score} / {test.result.total}
            </Badge>
          )}
        </div>
        <div className="text-[13px] text-muted-foreground">
          {test.questionCount}問
          {weeks && <span lang="ja"> · {weeks}</span>}
        </div>
      </Link>

      <DeleteTest test={test} className="-mt-2 -mr-2 md:hidden" />

      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-[1_1_auto] md:flex-wrap md:items-center md:justify-end">
        {test.result ? (
          <>
            {/* Retake clears the last result and review chips on the server, then opens the quiz. */}
            <Form method="post" action={`${quizHref}/retake`} className="contents">
              <Button type="submit" variant="outline" className={cn("md:order-2", test.review.length === 0 && "col-span-2")}>
                もう一度受ける
              </Button>
            </Form>
            {test.review.length > 0 && (
              <Button variant="outline" aria-expanded={open} onClick={() => setOpen(!open)} className="md:order-1 md:px-3.5">
                復習（{test.review.length}）
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")}
                />
              </Button>
            )}
          </>
        ) : (
          <Button asChild className="col-span-2 md:px-4.5">
            <Link to={quizHref}>テストを始める</Link>
          </Button>
        )}
        <DeleteTest test={test} className="hidden md:order-3 md:inline-flex" outlined />
      </div>

      {open && <GrammarChips testId={test.id} chips={test.review} className="w-full" />}
    </li>
  );
}
