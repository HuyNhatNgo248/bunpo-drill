import type { Active, Announcements, Over } from "@dnd-kit/core";
import type { I18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import type { DragData, DropData, OrderQuestion } from "../types";

/** What a screen reader hears while a piece moves, in the page's language. */
export function pieceAnnouncements(question: OrderQuestion, i18n: I18n): Announcements {
  const pieceText = (active: Active) => question.pieces[(active.data.current as DragData).piece];
  const zoneText = (over: Over | null) => {
    const zone = over?.data.current as DropData | undefined;
    if (!zone) return null;
    if ("bank" in zone) return i18n._(msg`the choices`);
    const n = zone.slot + 1;
    return zone.slot === question.starSlot - 1 ? i18n._(msg`the ★ slot`) : i18n._(msg`slot ${n}`);
  };
  return {
    onDragStart: ({ active }) => {
      const piece = pieceText(active);
      return i18n._(msg`Picked up “${piece}”.`);
    },
    onDragOver: ({ active, over }) => {
      const piece = pieceText(active);
      const zone = zoneText(over);
      return zone ? i18n._(msg`“${piece}” is over ${zone}.`) : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const piece = pieceText(active);
      const zone = zoneText(over);
      return zone ? i18n._(msg`Put “${piece}” in ${zone}.`) : i18n._(msg`Put “${piece}” back.`);
    },
    onDragCancel: ({ active }) => {
      const piece = pieceText(active);
      return i18n._(msg`Cancelled moving “${piece}”.`);
    },
  };
}
