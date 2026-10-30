import { randomBytes } from "node:crypto";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { orm, write } from "./db.server";
import { grammarPointSchema, LEVELS, PAYLOAD_VERSION, testPayloadSchema, type TestPayload } from "./payload";
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

export async function listTests(): Promise<ListedTest[]> {
  const rows = await (await orm())
    .select(listed)
    .from(tests)
    // Rows that are not JSON are skipped here, as toStoredTest skips them for getTest.
    .where(and(sql`json_valid(${tests.payload})`, or(isNull(tests.submission), sql`json_valid(${tests.submission})`)))
    // Tests not placed by a drag yet (new ones) come first, newest first; the rest follow their saved place.
    .orderBy(sql`${tests.position} IS NOT NULL`, tests.position, desc(tests.createdAt));
  return rows.map(toListedTest).filter((test): test is ListedTest => test !== null);
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

/** Saves the list order, top first. Ids that aren't tests are dropped. */
export async function saveOrder(ids: string[]): Promise<string[]> {
  const order = [...new Set(ids)].filter((id) => ID.test(id));
  if (order.length) {
    const db = await orm();
    const [first, ...rest] = order.map((id, position) => db.update(tests).set({ position }).where(eq(tests.id, id)));
    await write([first, ...rest]);
  }
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
