import type { Announcements, UniqueIdentifier } from "@dnd-kit/core";
import type { I18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";

/** What a screen reader hears while a row (a test, a chapter) is dragged to a new place in its list, in the page's language. */
export function listAnnouncements(rows: { id: UniqueIdentifier; title: string }[], i18n: I18n): Announcements {
  const titleOf = (id: UniqueIdentifier) => rows.find((row) => row.id === id)?.title ?? "";
  const placeOf = (id: UniqueIdentifier) => rows.findIndex((row) => row.id === id) + 1;
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
