import { useLingui } from "@lingui/react/macro";
import type { Level } from "~/lib/payload";
import type { ChapterSummary } from "~/lib/views";
import { ChapterRow } from "./ChapterRow";

/** A level's chapters, first chapter first. */
export function ChapterList({ level, chapters }: { level: Level; chapters: ChapterSummary[] }) {
  const { t } = useLingui();
  return (
    <ul aria-label={t`Chapters`} className="flex flex-col gap-4 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:bg-card">
      {chapters.map((chapter) => (
        <ChapterRow key={chapter.chapter} level={level} chapter={chapter} />
      ))}
    </ul>
  );
}
