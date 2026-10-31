import { randomBytes } from "node:crypto";
import { and, count, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { orm, write } from "./db.server";
import { grammarPointSchema, LEVELS, PAYLOAD_VERSION, testPayloadSchema, type Level, type TestPayload } from "./payload";
import { attempts, reviewed, tests } from "./schema.server";
import type { Answers } from "./views";

/**
 * Storage in the database from db.server.ts: a `tests` row per test holding the
 * payload, the last submission and its place in the home list, a `reviewed`
 * row per review chip marked reviewed, and an `attempts` row per submission.
 */

export type Submission = {
  submittedAt: string;
  answers: Answers;
  score: number;
  total: number;
  wrongGrammarIds: string[];
};

/** The score of one submission. A retake clears the submission but keeps its attempt. */
export type Attempt = { submittedAt: string; score: number; total: number };

export type StoredTest = {
  id: string;
  createdAt: string;
  payload: TestPayload;
  submission: Submission | null;
  reviewed: Record<string, boolean>;
  /** Oldest first. */
  attempts: Attempt[];
};

/** A test as the list shows it: no questions and no answers, which are most of a test's size. */
export type ListedTest = Omit<StoredTest, "payload" | "submission"> & {
  payload: Pick<TestPayload, "title" | "level" | "grammarPoints">;
  questionCount: number;
  submission: Omit<Submission, "answers"> | null;
};

const ID = /^[0-9]{8}-[0-9a-f]{6}$/;

/** A test's marked chips and its attempts, as JSON arrays, read in the same query as the test. */
const related = {
  reviewed: sql<string>`(SELECT json_group_array(${reviewed.grammarId}) FROM ${reviewed} WHERE ${reviewed.testId} = ${tests.id})`,
  attempts: sql<string>`(SELECT json_group_array(json_object('submittedAt', ${attempts.submittedAt}, 'score', ${attempts.score}, 'total', ${attempts.total}))
    FROM ${attempts} WHERE ${attempts.testId} = ${tests.id})`,
};

// The list reads each payload in SQL down to what it shows, so the questions never leave the database.
const listed = {
  id: tests.id,
  createdAt: tests.createdAt,
  version: sql<unknown>`${tests.payload} ->> '$.version'`,
  title: sql<unknown>`${tests.payload} ->> '$.title'`,
  level: sql<unknown>`${tests.payload} ->> '$.level'`,
  grammarPoints: sql<string | null>`${tests.payload} -> '$.grammarPoints'`,
  questionCount: sql<number | null>`json_array_length(${tests.payload}, '$.sections[0].questions')
    + json_array_length(${tests.payload}, '$.sections[1].questions')
    + (SELECT ifnull(sum(json_array_length(value, '$.questions')), 0) FROM json_each(${tests.payload}, '$.sections[2].passages'))`,
  submission: sql<string | null>`json_remove(${tests.submission}, '$.answers')`,
  ...related,
};

/** What the list checks of a payload, the way toStoredTest checks all of it: older formats are skipped. */
const listedSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  title: z.string(),
  level: z.enum(LEVELS),
  grammarPoints: z.array(grammarPointSchema),
  questionCount: z.number().int(),
});

/** A column's JSON, or NULL when it is not JSON: ->> and json_each on a broken row would fail the whole query. */
const json = (column: typeof tests.payload | typeof tests.submission) => sql`(CASE WHEN json_valid(${column}) THEN ${column} END)`;

/** The rows the list can show: JSON in the current payload format, and of `level` when there is one. */
const listable = (level?: Level) =>
  and(
    sql`${json(tests.payload)} ->> '$.version' = ${PAYLOAD_VERSION}`,
    or(isNull(tests.submission), sql`json_valid(${tests.submission})`),
    level && sql`${json(tests.payload)} ->> '$.level' = ${level}`,
  );

// Tests not placed by a drag yet (new ones) come first, newest first; the rest follow their saved place.
// The id settles ties, so a test is never on two pages.
const listOrder = [sql`${tests.position} IS NOT NULL`, tests.position, desc(tests.createdAt), tests.id];

/** The tests in the list's order: every one, or one level's, `limit` of them from `offset`. */
export async function listTests({ level, limit = -1, offset = 0 }: { level?: Level; limit?: number; offset?: number } = {}): Promise<ListedTest[]> {
  const rows = await (await orm())
    .select(listed)
    .from(tests)
    .where(listable(level))
    .orderBy(...listOrder)
    // SQLite reads a LIMIT of -1 as no limit.
    .limit(limit)
    .offset(offset);
  return rows.map(toListedTest).filter((test): test is ListedTest => test !== null);
}

/** The figures over all of a level's tests, not one page: how many, how many taken, their average, and the patterns to review. */
export async function levelStats(level: Level) {
  const db = await orm();
  const score = sql`${tests.submission} ->> '$.score'`;
  const total = sql`${tests.submission} ->> '$.total'`;
  const [[counts], [review]] = await Promise.all([
    db
      .select({
        total: count(),
        taken: count(tests.submission),
        // Each score as a whole percent first, as its row shows it; then their average.
        average: sql<number | null>`avg(CASE WHEN ${total} = 0 THEN 0 ELSE round(100.0 * ${score} / ${total}) END)`,
      })
      .from(tests)
      .where(listable(level)),
    // A pattern counts once however many tests got it wrong, and not at all where its chip is marked reviewed.
    db
      .select({ toReview: sql<number>`count(DISTINCT point.value ->> '$.pattern')` })
      .from(
        sql`${tests}, json_each(${json(tests.submission)}, '$.wrongGrammarIds') AS wrong, json_each(${json(tests.payload)}, '$.grammarPoints') AS point`,
      )
      .where(
        and(
          listable(level),
          sql`point.value ->> '$.id' = wrong.value`,
          sql`NOT EXISTS (SELECT 1 FROM ${reviewed} WHERE ${reviewed.testId} = ${tests.id} AND ${reviewed.grammarId} = wrong.value)`,
        ),
      ),
  ]);
  const { average, ...rest } = counts!;
  return { ...rest, average: average === null ? null : Math.round(average), toReview: review!.toReview };
}

/** The level of the newest test the list can show, or null before there is one. */
export async function newestLevel(): Promise<Level | null> {
  const [newest] = await (await orm())
    .select({ level: sql<string>`${tests.payload} ->> '$.level'` })
    .from(tests)
    .where(listable())
    .orderBy(desc(tests.createdAt))
    .limit(1);
  return LEVELS.find((level) => level === newest?.level) ?? null;
}

export async function getTest(id: string): Promise<StoredTest | null> {
  if (!ID.test(id)) return null;
  const [row] = await (await orm())
    .select({ id: tests.id, createdAt: tests.createdAt, payload: tests.payload, submission: tests.submission, ...related })
    .from(tests)
    .where(eq(tests.id, id));
  return row ? toStoredTest(row) : null;
}

export async function createTest(payload: TestPayload): Promise<StoredTest> {
  const now = new Date();
  const test: StoredTest = {
    id: `${now.toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex")}`,
    createdAt: now.toISOString(),
    payload,
    submission: null,
    reviewed: {},
    attempts: [],
  };
  await (await orm()).insert(tests).values({ id: test.id, createdAt: test.createdAt, payload: JSON.stringify(payload) });
  return test;
}

/**
 * Saves the order of some tests, top first, such as the tests of one page: they swap the places they hold between
 * them, and every other test keeps its place. Ids that aren't tests are dropped.
 * shortcut: places are numbered from 0 over all tests, so the first drag after a new test (unplaced, so first) rewrites
 * every row; give a new test a place above the top one if that gets slow with thousands of tests.
 */
export async function saveOrder(ids: string[]): Promise<string[]> {
  const order = [...new Set(ids)].filter((id) => ID.test(id));
  const db = await orm();
  const all = await db.select({ id: tests.id, position: tests.position }).from(tests).orderBy(...listOrder);
  const known = new Set(all.map((test) => test.id));
  const moved = order.filter((id) => known.has(id));
  const moving = new Set(moved);
  // The tests being ordered take the slots they fill in the list now, in their new order.
  let next = 0;
  const placed = all.map((test) => (moving.has(test.id) ? moved[next++]! : test.id));
  const was = new Map(all.map((test) => [test.id, test.position]));
  const [first, ...rest] = placed.flatMap((id, position) =>
    was.get(id) === position ? [] : [db.update(tests).set({ position }).where(eq(tests.id, id))],
  );
  if (first) await write([first, ...rest]);
  return order;
}

export async function saveSubmission(id: string, submission: Submission) {
  const { submittedAt, score, total } = submission;
  const db = await orm();
  await write([
    db.update(tests).set({ submission: JSON.stringify(submission) }).where(eq(tests.id, id)),
    // Selecting from tests adds no attempt for a test that is gone; the same submission twice adds one.
    db
      .insert(attempts)
      .select(
        db
          .select({
            testId: tests.id,
            submittedAt: sql<string>`${submittedAt}`.as("submitted_at"),
            score: sql<number>`${score}`.as("score"),
            total: sql<number>`${total}`.as("total"),
          })
          .from(tests)
          .where(eq(tests.id, id)),
      )
      .onConflictDoNothing(),
  ]);
}

/** Retake: forget the last submission and the reviewed chips. Its score stays in the attempts. False when there is no such test. */
export async function resetTest(id: string): Promise<boolean> {
  const db = await orm();
  const [reset] = await write([
    db.update(tests).set({ submission: null }).where(eq(tests.id, id)),
    db.delete(reviewed).where(eq(reviewed.testId, id)),
  ]);
  return reset.rowsAffected > 0;
}

export async function setReviewed(id: string, grammarId: string, marked: boolean) {
  const db = await orm();
  await (marked
    ? // Selecting from tests adds nothing when the test doesn't exist; marking twice keeps one mark.
      db
        .insert(reviewed)
        .select(
          db
            .select({ testId: tests.id, grammarId: sql<string>`${grammarId}`.as("grammar_id") })
            .from(tests)
            .where(eq(tests.id, id)),
        )
        .onConflictDoNothing()
    : db.delete(reviewed).where(and(eq(reviewed.testId, id), eq(reviewed.grammarId, grammarId))));
  return getTest(id);
}

export async function deleteTest(id: string): Promise<boolean> {
  if (!ID.test(id)) return false;
  const db = await orm();
  const [, , deleted] = await write([
    db.delete(reviewed).where(eq(reviewed.testId, id)),
    db.delete(attempts).where(eq(attempts.testId, id)),
    db.delete(tests).where(eq(tests.id, id)),
  ]);
  return deleted.rowsAffected > 0;
}

export async function deleteAllTests(): Promise<number> {
  const db = await orm();
  const [, , deleted] = await write([db.delete(reviewed), db.delete(attempts), db.delete(tests)]);
  return deleted.rowsAffected;
}

/** The JSON of a test's marked chips and attempts, as `related` reads them. */
type Related = { reviewed: string; attempts: string };

function toStoredTest(row: { id: string; createdAt: string; payload: string; submission: string | null } & Related): StoredTest | null {
  try {
    // Rows from an older payload format (or edited by hand) are skipped, not crashed on.
    const payload = testPayloadSchema.safeParse(JSON.parse(row.payload));
    if (!payload.success) return null;
    return {
      ...rowBasics(row),
      payload: payload.data,
      submission: row.submission === null ? null : (JSON.parse(row.submission) as Submission),
    };
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function toListedTest(
  row: { id: string; createdAt: string; version: unknown; title: unknown; level: unknown; grammarPoints: string | null } & {
    questionCount: number | null;
    submission: string | null;
  } & Related,
): ListedTest | null {
  const parsed = listedSchema.safeParse({
    version: row.version,
    title: row.title,
    level: row.level,
    grammarPoints: row.grammarPoints === null ? null : JSON.parse(row.grammarPoints),
    questionCount: row.questionCount === null ? null : Number(row.questionCount),
  });
  if (!parsed.success) return null;
  const { title, level, grammarPoints, questionCount } = parsed.data;
  return {
    ...rowBasics(row),
    payload: { title, level, grammarPoints },
    questionCount,
    submission: row.submission === null ? null : (JSON.parse(row.submission) as ListedTest["submission"]),
  };
}

/** The columns that every read of a test has. */
function rowBasics(row: { id: string; createdAt: string } & Related) {
  const marked = JSON.parse(row.reviewed) as string[];
  return {
    id: row.id,
    createdAt: row.createdAt,
    reviewed: Object.fromEntries(marked.map((grammarId) => [grammarId, true])),
    attempts: (JSON.parse(row.attempts) as Attempt[]).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)),
  };
}
