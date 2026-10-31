import { useLingui } from "@lingui/react/macro";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useFetcher } from "react-router";
import type { TestSummary } from "~/lib/views";
import { REORDER_KEY } from "../helpers/fetchers";
import { listAnnouncements } from "~/components/helpers/announcements";
import { TestRow } from "./TestRow";

/** The tests, in the order the user dragged them to. Dropping a test saves the new order. */
export function TestList({ tests }: { tests: TestSummary[] }) {
  const { t, i18n } = useLingui();
  const reorder = useFetcher({ key: REORDER_KEY });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = tests.map((test) => test.id);
    const order = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    // flushSync: render the new order in the same frame the drag ends, so the row doesn't jump back first.
    reorder.submit({ order }, { method: "patch", action: "/api/tests", encType: "application/json", flushSync: true });
  };

  return (
    <DndContext
      id="test-list"
      sensors={sensors}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        announcements: listAnnouncements(tests, i18n),
        screenReaderInstructions: {
          draggable: t`Press Space to pick a test up, the up and down arrow keys to move it, and Space again to put it down. Press Escape to cancel.`,
        },
      }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={tests.map((test) => test.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-4 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:bg-card">
          {tests.map((test) => (
            <TestRow key={test.id} test={test} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
