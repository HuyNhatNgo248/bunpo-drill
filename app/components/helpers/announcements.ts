import type { Announcements, UniqueIdentifier } from "@dnd-kit/core";
import type { I18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import type { TestSummary } from "~/lib/views";

/** What a screen reader hears while a test is dragged to a new place, in the page's language. */
export function listAnnouncements(tests: TestSummary[], i18n: I18n): Announcements {
  const titleOf = (id: UniqueIdentifier) => tests.find((test) => test.id === id)?.title ?? "";
  const placeOf = (id: UniqueIdentifier) => tests.findIndex((test) => test.id === id) + 1;
  return {
    onDragStart: ({ active }) => {
      const title = titleOf(active.id);
      return i18n._(msg`Picked up “${title}”.`);
    },
    onDragOver: ({ active, over }) => {
      if (!over) return undefined;
      const title = titleOf(active.id);
      const place = placeOf(over.id);
      return i18n._(msg`Moved “${title}” to place ${place}.`);
    },
    onDragEnd: ({ active, over }) => {
      if (!over) return undefined;
      const title = titleOf(active.id);
      const place = placeOf(over.id);
      return i18n._(msg`Put “${title}” down in place ${place}.`);
    },
    onDragCancel: ({ active }) => {
      const title = titleOf(active.id);
      return i18n._(msg`Cancelled moving “${title}”.`);
    },
  };
}
