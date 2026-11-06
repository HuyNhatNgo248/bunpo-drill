import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Progress } from "~/components/ui/progress";
import { cardsOf } from "~/lib/links";
import { chapterTitle } from "~/lib/sections";
import type { Level } from "~/lib/payload";
import type { ChapterSummary } from "~/lib/views";

/**
 * One lesson of a chapter, a page of the book, as a row of it: its title, how many of its words are learned,
 * and the way to its flashcards. The whole row opens them.
 */
export function LessonRow({
  level,
  chapter,
  lesson,
}: {
  level: Level;
  chapter: number;
  lesson: ChapterSummary["lessons"][number];
}) {
  const { t } = useLingui();
  const { title, page, words, learned } = lesson;
  return (
    <li className="relative flex min-h-16 items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/60">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Its ::after covers the row, so the whole row opens the flashcards. */}
        <Link
          to={cardsOf(level, chapter, { page })}
          prefetch="intent"
          lang="ja"
          className="truncate font-jp text-base font-semibold text-foreground no-underline after:absolute after:inset-0"
        >
          {chapterTitle(title)}
        </Link>
        <span className="flex items-center gap-2.5">
          {/* The numbers say it; the bar is for the eye. */}
          <Progress aria-hidden="true" value={words === 0 ? 0 : (learned / words) * 100} className="h-1.5 max-w-56" />
          <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
            <Plural value={words} one="# word" other="# words" />
            {" · "}
            <Trans>{learned} learned</Trans>
          </span>
        </span>
      </div>
      <span className={cn(buttonVariants({ variant: "outline" }))}>
        {/* A phone row is narrow: the short word. */}
        <span className="md:hidden">{t`Cards`}</span>
        <span className="hidden md:inline">{t`Flashcards`}</span>
      </span>
    </li>
  );
}
