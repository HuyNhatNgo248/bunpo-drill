import type { DropData } from "../types";

/**
 * The slot or the bank of this question under the point (x, y), or null.
 * The drop uses the point where the pointer was released, because dnd-kit's `over` can lag behind a fast drag.
 */
export function dropTargetAt(questionId: string, x: number, y: number): DropData | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const zone = element.closest<HTMLElement>("[data-drop]");
    if (zone?.dataset.question !== questionId) continue;
    return zone.dataset.drop === "bank" ? { bank: true } : { slot: Number(zone.dataset.drop) };
  }
  return null;
}
