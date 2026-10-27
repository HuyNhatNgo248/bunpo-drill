import type { Active, Announcements, Over } from "@dnd-kit/core";
import type { DragData, DropData, OrderQuestion } from "../types";

/** What a screen reader hears while a piece moves. dnd-kit's own words are English. */
export function pieceAnnouncements(question: OrderQuestion): Announcements {
  const pieceText = (active: Active) => question.pieces[(active.data.current as DragData).piece];
  const zoneText = (over: Over | null) => {
    const zone = over?.data.current as DropData | undefined;
    if (!zone) return null;
    if ("bank" in zone) return "選択肢";
    return zone.slot === question.starSlot - 1 ? "★の空欄" : `空欄${zone.slot + 1}`;
  };
  return {
    onDragStart: ({ active }) => `「${pieceText(active)}」を持ち上げました。`,
    onDragOver: ({ active, over }) => {
      const zone = zoneText(over);
      return zone ? `「${pieceText(active)}」は${zone}の上にあります。` : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const zone = zoneText(over);
      return zone ? `「${pieceText(active)}」を${zone}に置きました。` : `「${pieceText(active)}」を戻しました。`;
    },
    onDragCancel: ({ active }) => `「${pieceText(active)}」の移動を取り消しました。`,
  };
}
