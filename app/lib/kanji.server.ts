import { desc, eq, and, sql } from "drizzle-orm";
import { orm } from "./db.server";
import { kanjiChapterSchema, type KanjiChapter } from "./kanji-payload";
import { LEVELS, type Level } from "./payload";
import { kanjiChapters, learnedWords, tests } from "./schema.server";

/**
 * Storage for the kanji side: a `kanji_chapters` row per chapter of 漢字マスター (its words, sent again to update them),
 * a `learned_words` row per word marked learned on a flashcard, and the kanji tests, which live in `tests` with the
 * grammar ones (tests.server.ts).
 */

/** Saves a chapter, or replaces it when it was sent before. Its words' learned marks stay. */
export async function saveChapter(chapter: KanjiChapter): Promise<void> {
  const row = { level: chapter.level, chapter: chapter.chapter, payload: JSON.stringify(chapter), updatedAt: new Date().toISOString() };
  await (await orm())
    .insert(kanjiChapters)
    .values(row)
    .onConflictDoUpdate({ target: [kanjiChapters.level, kanjiChapters.chapter], set: { payload: row.payload, updatedAt: row.updatedAt } });
}

export async function getChapter(level: Level, chapter: number): Promise<KanjiChapter | null> {
  const [row] = await (await orm())
    .select({ payload: kanjiChapters.payload })
    .from(kanjiChapters)
    .where(and(eq(kanjiChapters.level, level), eq(kanjiChapters.chapter, chapter)));
  return row ? toChapter(row.payload) : null;
}

/** A level's chapters, first chapter first. */
export async function listChapters(level: Level): Promise<KanjiChapter[]> {
  const rows = await (await orm())
    .select({ payload: kanjiChapters.payload })
    .from(kanjiChapters)
    .where(eq(kanjiChapters.level, level))
    .orderBy(kanjiChapters.chapter);
  return rows.map((row) => toChapter(row.payload)).filter((chapter): chapter is KanjiChapter => chapter !== null);
}

/** The levels that have a chapter, easiest first. */
export async function chapterLevels(): Promise<Level[]> {
  const rows = await (await orm()).selectDistinct({ level: kanjiChapters.level }).from(kanjiChapters);
  return LEVELS.filter((level) => rows.some((row) => row.level === level));
}

/** The ids of every word marked learned. */
export async function learnedIds(): Promise<Set<string>> {
  const rows = await (await orm()).select({ wordId: learnedWords.wordId }).from(learnedWords);
  return new Set(rows.map((row) => row.wordId));
}

/** Marks a word learned; marking it twice keeps the first time. */
export async function markLearned(id: string): Promise<void> {
  await (await orm()).insert(learnedWords).values({ wordId: id, learnedAt: new Date().toISOString() }).onConflictDoNothing();
}

/** A chapter's newest kanji test: its score once taken, and the words it got wrong. */
export type LatestKanjiTest = { id: string; result: { score: number; total: number } | null; wrongIds: string[] };

/** The newest kanji test of each of a level's chapters, by chapter. */
export async function latestKanjiTests(level: Level): Promise<Map<number, LatestKanjiTest>> {
  const payload = sql`(CASE WHEN json_valid(${tests.payload}) THEN ${tests.payload} END)`;
  const submission = sql`(CASE WHEN json_valid(${tests.submission}) THEN ${tests.submission} END)`;
  const rows = await (await orm())
    .select({
      id: tests.id,
      chapter: sql<number>`${payload} ->> '$.chapter'`,
      score: sql<number | null>`${submission} ->> '$.score'`,
      total: sql<number | null>`${submission} ->> '$.total'`,
      wrongIds: sql<string | null>`${submission} -> '$.wrongGrammarIds'`,
    })
    .from(tests)
    .where(and(sql`${payload} ->> '$.kind' = 'kanji'`, sql`${payload} ->> '$.level' = ${level}`))
    .orderBy(desc(tests.createdAt), desc(tests.id));
  const latest = new Map<number, LatestKanjiTest>();
  for (const row of rows) {
    if (latest.has(row.chapter)) continue;
    latest.set(row.chapter, {
      id: row.id,
      result: row.score === null || row.total === null ? null : { score: row.score, total: row.total },
      wrongIds: row.wrongIds === null ? [] : (JSON.parse(row.wrongIds) as string[]),
    });
  }
  return latest;
}

/** A saved chapter, or null when it is in no current format (an older one, or edited by hand). */
function toChapter(json: string): KanjiChapter | null {
  try {
    const parsed = kanjiChapterSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}
