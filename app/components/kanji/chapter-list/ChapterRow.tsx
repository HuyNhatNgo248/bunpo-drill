import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Layers } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cardsOf } from "~/lib/links";
import type { Level } from "~/lib/payload";
import { chapterLabel } from "~/lib/sections";
import { cn } from "~/lib/utils";
import type { ChapterSummary } from "~/lib/views";

/** One chapter: its title and newest quiz score, how many words are learned, and the way to its flashcards and its quiz. */
export function ChapterRow({ level, chapter }: { level: Level; chapter: ChapterSummary }) {
  const { i18n } = useLingui();
  const { words, learned, quiz } = chapter;
  const quizHref = quiz && (quiz.result ? `/tests/${quiz.id}/results` : `/tests/${quiz.id}`);
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:p-5 md:last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row-title md:gap-2">
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
        <div aria-hidden="true" className="mt-1 h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-indigo" style={{ width: `${words === 0 ? 0 : (learned / words) * 100}%` }} />
        </div>
      </div>

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
