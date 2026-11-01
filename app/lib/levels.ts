/*
 * The JLPT levels and which ones the app has content for. Kept apart from payload.ts, whose zod schemas would
 * otherwise be downloaded by every page that only needs a level's name.
 */

/** Every JLPT level, easiest first: the home page has a tab for each. */
export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

/** The levels a mock test can be made for so far; the others show that they are not available yet. */
export const LEVELS = ["N3", "N2"] as const satisfies readonly JlptLevel[];
export type Level = (typeof LEVELS)[number];

export const isTestLevel = (level: JlptLevel): level is Level => LEVELS.some((l) => l === level);

/** The level of the 漢字マスター book the kanji chapters come from; the kanji page's other levels have none yet. */
export const KANJI_LEVEL = "N2" satisfies Level;
