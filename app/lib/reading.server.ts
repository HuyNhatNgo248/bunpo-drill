import { and, eq, sql } from "drizzle-orm";
import { orm } from "./db.server";
import { questionCount } from "./grading.server";
import type { Level } from "./payload";
import { passagesOf, READING_TYPES, readingGroupOf, readingTestPayloadSchema, TARGET_SECONDS, type QuestionKind, type ReadingTestPayload } from "./reading-payload";
import { progress, tests } from "./schema.server";
import { answeredCount, readDraft, type Draft, type Submission } from "./tests.server";
import type { JlptLevel } from "./levels";
import type { ReadingGroup, ReadingHomeView } from "./views";

/**
 * The reading page's data: the reading sets, which live in `tests` with the others (tests.server.ts), with a user's
 * progress on each.
 */

/** A reading set with `userId`'s last submission and draft on it. */
export type ReadingSetRow = { id: string; payload: ReadingTestPayload; submission: Submission | null; draft: Draft | null };

/**
 * A level's reading sets, oldest first, with `userId`'s progress.
 * shortcut: reads every set's whole payload to sum up its misses and times; read only those fields in SQL if a level
 * ever holds hundreds of sets.
 */
export async function listReadingSets(level: Level, userId: number): Promise<ReadingSetRow[]> {
  const payload = sql`(CASE WHEN json_valid(${tests.payload}) THEN ${tests.payload} END)`;
  const rows = await (await orm())
    .select({ id: tests.id, payload: tests.payload, submission: progress.submission, draft: progress.draft })
    .from(tests)
    .leftJoin(progress, and(eq(progress.testId, tests.id), eq(progress.userId, userId)))
    .where(and(sql`${payload} ->> '$.kind' = 'reading'`, sql`${payload} ->> '$.level' = ${level}`))
    .orderBy(tests.createdAt, tests.id);
  return rows.flatMap((row) => {
    // A set in an older format, or edited by hand, is left out rather than failing the page.
    const parsed = readingTestPayloadSchema.safeParse(parseJson(row.payload));
    if (!parsed.success) return [];
    const submission = parseJson(row.submission) as Submission | null;
    return [{ id: row.id, payload: parsed.data, submission: submission?.answers ? submission : null, draft: readDraft(row.draft) }];
  });
}

function parseJson(text: string | null): unknown {
  try {
    return text === null ? null : JSON.parse(text);
  } catch {
    return null;
  }
}

/** Compares titles with their numbers as numbers: 短文 2 before 短文 10. */
const titleOrder = new Intl.Collator("ja", { numeric: true });

/** The groups of the reading page: one per reading type, then 総合, each with its sets, its misses and its pace. */
export function toReadingHome(level: JlptLevel, sets: ReadingSetRow[]): ReadingHomeView {
  const types = [...READING_TYPES, "mixed" as const];
  return {
    level,
    groups: types.map((type, i): ReadingGroup => {
      const value = i + 1;
      const own = sets.filter((set) => readingGroupOf(set.payload) === value).sort((a, b) => titleOrder.compare(a.payload.title, b.payload.title));
      return { value, type, sets: own.map(toSetSummary), missed: missedKinds(own), pace: paceOf(own) };
    }),
  };
}

function toSetSummary({ id, payload, submission, draft }: ReadingSetRow): ReadingGroup["sets"][number] {
  return {
    id,
    title: payload.title,
    questionCount: questionCount(payload),
    targetSeconds: passagesOf(payload).reduce((sum, { type }) => sum + TARGET_SECONDS[type], 0),
    answered: draft && !submission ? answeredCount(draft.answers) : null,
    result: submission && { score: submission.score, total: submission.total },
    seconds: submission?.times ? submission.times.reduce((sum, seconds) => sum + seconds, 0) : null,
  };
}

/** The kinds of the questions the taken sets got wrong, with how often, most first; ties in the exam's order of kinds. */
function missedKinds(sets: ReadingSetRow[]): ReadingGroup["missed"] {
  const counts = new Map<QuestionKind, number>();
  for (const { payload, submission } of sets) {
    const wrong = new Set(submission?.wrongGrammarIds);
    for (const { passage } of passagesOf(payload)) {
      for (const question of passage.questions) if (wrong.has(question.id)) counts.set(question.kind, (counts.get(question.kind) ?? 0) + 1);
    }
  }
  return [...counts].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);
}

/** The average seconds a passage took in the timed sets, and the average target of those passages. */
function paceOf(sets: ReadingSetRow[]): ReadingGroup["pace"] {
  let seconds = 0;
  let target = 0;
  let passages = 0;
  for (const { payload, submission } of sets) {
    if (!submission?.times) continue;
    passagesOf(payload).forEach(({ type }, i) => {
      seconds += submission.times![i] ?? 0;
      target += TARGET_SECONDS[type];
      passages += 1;
    });
  }
  return passages ? { seconds: Math.round(seconds / passages), target: Math.round(target / passages) } : null;
}
