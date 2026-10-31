import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { cardsOf } from "~/lib/links";
import type { Level } from "~/lib/payload";
import { chapterLabel } from "~/lib/sections";
import { cn } from "~/lib/utils";
import type { ChapterSummary } from "~/lib/views";

/**
 * One chapter: its handle to drag, its title and newest quiz score, how many words are learned, and the way to its
 * flashcards and its quiz. The whole row opens the flashcards.
 */
export function ChapterRow({ level, chapter }: { level: Level; chapter: ChapterSummary }) {
  const { t, i18n } = useLingui();
  const { words, learned, quiz } = chapter;
  const sortable = useSortable({ id: chapter.chapter, attributes: { roleDescription: t`sortable` } });
  const quizHref = quiz && (quiz.result ? `/tests/${quiz.id}/results` : `/tests/${quiz.id}`);
  const title = `${chapterLabel(i18n, chapter.chapter)} ${chapter.title}`;
  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      className={cn(
        "relative isolate flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/60 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:p-5 md:last:border-b-0",
        sortable.isDragging && "relative z-10 shadow-float hover:bg-card",
      )}
    >
      {/* Drag by this handle only, so the rest of the row still scrolls, opens the flashcards and works its buttons. */}
      <button
        type="button"
        ref={sortable.setActivatorNodeRef}
        {...sortable.attributes}
        {...sortable.listeners}
        aria-label={t`Reorder “${title}”`}
        className="-my-0.5 -ml-2 flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-faint outline-none hover:text-subtle-foreground focus-visible:ring-3 focus-visible:ring-ring/40 active:cursor-grabbing md:-ml-3 md:h-10"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>

      {/* Its ::after fills the row under the buttons, so the whole row opens the flashcards but the buttons still work. */}
      <Link
        to={cardsOf(level, chapter.chapter)}
        className="flex min-w-0 flex-1 flex-col gap-1 text-foreground no-underline after:absolute after:inset-0 after:-z-10 md:flex-row-title md:gap-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft" className="text-2xs md:text-xs">
            {chapterLabel(i18n, chapter.chapter)}
          </Badge>
          <span lang="ja" className="font-jp text-base font-semibold">
            {chapter.title}
          </span>
          {quiz?.result && (
            <Badge variant="outline">
              {quiz.result.score} / {quiz.result.total}
            </Badge>
          )}
        </div>
        <div className="text-caption text-muted-foreground">
          <Plural value={words} one="# word" other="# words" />
          {" · "}
          <Trans>{learned} learned</Trans>
          {!quiz && (
            <>
              {" · "}
              <Trans>no quiz yet</Trans>
            </>
          )}
        </div>
        {/* The counts above say it; the bar is for the eye, so it is not read out. */}
        <Progress aria-hidden="true" value={words === 0 ? 0 : (learned / words) * 100} className="mt-1 max-w-48" />
      </Link>

      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-auto md:flex-wrap md:items-center md:justify-end">
        <Button asChild className={cn("md:px-4.5", !quizHref && "col-span-2")}>
          <Link to={cardsOf(level, chapter.chapter)}>
            <Layers aria-hidden="true" />
            <Trans>Flashcards</Trans>
          </Link>
        </Button>
        {quizHref && (
          <Button asChild variant="outline">
            <Link to={quizHref}>
              <Trans>Quiz</Trans>
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}
