import { useLingui } from "@lingui/react/macro";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useFetcher } from "react-router";
import { listAnnouncements } from "~/components/helpers/announcements";
import type { Level } from "~/lib/payload";
import { chapterLabel } from "~/lib/sections";
import type { ChapterSummary } from "~/lib/views";
import { ChapterRow } from "./ChapterRow";

/** A level's chapters, in the order the user dragged them to. Dropping a chapter saves the new order. */
export function ChapterList({ level, chapters: saved }: { level: Level; chapters: ChapterSummary[] }) {
  const { t, i18n } = useLingui();
  const reorder = useFetcher();
  // The order that is saving now, shown at once instead of after the reload.
  const pending = reorder.state === "idle" ? null : (reorder.json as { order: number[] }).order;
  const chapters = pending ? [...saved].sort((a, b) => pending.indexOf(a.chapter) - pending.indexOf(b.chapter)) : saved;
  const ids = chapters.map((chapter) => chapter.chapter);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const order = arrayMove(ids, ids.indexOf(Number(active.id)), ids.indexOf(Number(over.id)));
    // flushSync: render the new order in the same frame the drag ends, so the row doesn't jump back first.
    reorder.submit({ level, order }, { method: "patch", action: "/api/kanji/chapters", encType: "application/json", flushSync: true });
  };

  return (
    <DndContext
      id="chapter-list"
      sensors={sensors}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        announcements: listAnnouncements(
          chapters.map((chapter) => ({ id: chapter.chapter, title: `${chapterLabel(i18n, chapter.chapter)} ${chapter.title}` })),
          i18n,
        ),
        screenReaderInstructions: {
          draggable: t`Press Space to pick a chapter up, the up and down arrow keys to move it, and Space again to put it down. Press Escape to cancel.`,
        },
      }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul aria-label={t`Chapters`} className="flex flex-col gap-4 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:bg-card">
          {chapters.map((chapter) => (
            <ChapterRow key={chapter.chapter} level={level} chapter={chapter} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
