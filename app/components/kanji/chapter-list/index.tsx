import { Trans, useLingui } from "@lingui/react/macro";
import { useSearchParams } from "react-router";
import { Rail } from "~/components/Rail";
import { Badge } from "~/components/ui/badge";
import type { Level } from "~/lib/payload";
import { chapterTitle } from "~/lib/sections";
import type { ChapterSummary } from "~/lib/views";
import { LessonRow } from "./LessonRow";
import { QuizRow } from "./QuizRow";

/**
 * A level's `chapters` (at least one) as topics, one at a time, like the weeks of the mock tests: the topics to pick
 * from, then the topic picked: its lessons in the book's order, then its quiz. The topic is in the address (`chapter`);
 * without one, or one that isn't there, it is the first with a word left to learn.
 */
export function ChapterList({ level, chapters }: { level: Level; chapters: ChapterSummary[] }) {
  const { t } = useLingui();
  const [params] = useSearchParams();
  const picked = Number(params.get("chapter"));
  const shown =
    chapters.find(({ chapter }) => chapter === picked) ?? chapters.find(({ learned, words }) => learned < words) ?? chapters[0];
  const { chapter, title, words, learned, lessons, quiz } = shown;

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
      <Rail
        label={t`Topics`}
        param="chapter"
        numbered
        current={chapter}
        items={chapters.map((summary) => ({
          value: summary.chapter,
          label: (
            <span lang="ja" className="font-jp">
              {chapterTitle(summary.title)}
            </span>
          ),
          done: summary.learned,
          total: summary.words,
        }))}
      />
      {/* Pinned on a computer, so the topic picked low in the long column is still beside it, without the page moving. */}
      <section aria-labelledby="kanji-chapter" className="flex min-w-0 flex-1 flex-col gap-6 md:sticky md:top-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="kanji-chapter" lang="ja" className="font-jp text-xl font-bold md:text-2xl">
            {chapterTitle(title)}
          </h2>
          <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
            <Trans>
              {learned} / {words} learned
            </Trans>
            {!quiz && (
              <>
                {" · "}
                <Trans>no quiz yet</Trans>
              </>
            )}
          </span>
        </div>
        <section aria-labelledby="kanji-lessons" className="flex flex-col gap-2.5">
          <h3 id="kanji-lessons" className="flex items-center gap-2 text-caption font-semibold text-subtle-foreground">
            {t`Lessons`} <Badge variant="count">{lessons.length}</Badge>
          </h3>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {lessons.map((lesson) => (
              <LessonRow key={lesson.page} level={level} chapter={chapter} lesson={lesson} />
            ))}
          </ul>
        </section>
        {quiz && <QuizRow quiz={quiz} />}
      </section>
    </div>
  );
}
