/*
 * The JLPT levels and which ones the app has content for. Kept apart from payload.ts, whose zod schemas would
 * otherwise be downloaded by every page that only needs a level's name.
 */

/** Every JLPT level, easiest first: the home page has a tab for each. */
export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

/** The levels a test or a kanji chapter can be sent for: every level, so a level shows its content once some is sent. */
export const LEVELS = JLPT_LEVELS;
export type Level = (typeof LEVELS)[number];

export const isTestLevel = (level: JlptLevel): level is Level => LEVELS.some((l) => l === level);

/** The kanji page's level when none is named and none was opened before. */
export const KANJI_LEVEL = "N2" satisfies Level;
