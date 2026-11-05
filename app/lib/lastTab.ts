import { JLPT_LEVELS, type JlptLevel } from "./levels";
import type { TestKind } from "./views";

/** A list page: the grammar mock tests, the kanji or the reading sets, at a level. The account keeps the last one opened (users.server.ts). */
export type Tab = { subject: TestKind; level: JlptLevel };

/** How a tab is saved: "kanji:N2". */
export const tabValue = ({ subject, level }: Tab) => `${subject}:${level}`;

/**
 * The tab a saved value names, or null for none or one that can't be read.
 *
 * @example
 * parseTab("kanji:N2"); // -> { subject: "kanji", level: "N2" }
 */
export function parseTab(value: string | null | undefined): Tab | null {
  const [subject, name] = value?.split(":") ?? [];
  const level = JLPT_LEVELS.find((candidate) => candidate === name);
  return (subject === "grammar" || subject === "kanji" || subject === "reading") && level ? { subject, level } : null;
}
