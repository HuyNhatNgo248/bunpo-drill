import { randomBytes } from "node:crypto";
import type { InStatement, Row } from "@libsql/client";
import { z } from "zod";
import { db } from "./db.server";
import { grammarPointSchema, LEVELS, PAYLOAD_VERSION, testPayloadSchema, type TestPayload } from "./payload";
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

const REVIEWED_AND_ATTEMPTS = `
    (SELECT json_group_array(grammar_id) FROM reviewed WHERE test_id = tests.id) AS reviewed,
    (SELECT json_group_array(json_object('submittedAt', submitted_at, 'score', score, 'total', total))
      FROM attempts WHERE test_id = tests.id) AS attempts`;

const SELECT_TEST = `SELECT id, created_at, payload, submission, ${REVIEWED_AND_ATTEMPTS} FROM tests`;

// The list reads each payload in SQL down to what it shows, so the questions never leave the database.
// Rows that are not JSON are skipped here, as toStoredTest skips them for getTest.
const SELECT_LISTED = `
  SELECT id, created_at,
    payload ->> '$.version' AS version,
    payload ->> '$.title' AS title,
    payload ->> '$.level' AS level,
    payload -> '$.grammarPoints' AS grammar_points,
    json_array_length(payload, '$.sections[0].questions') + json_array_length(payload, '$.sections[1].questions')
      + (SELECT ifnull(sum(json_array_length(value, '$.questions')), 0) FROM json_each(payload, '$.sections[2].passages'))
      AS question_count,
    json_remove(submission, '$.answers') AS submission,
    ${REVIEWED_AND_ATTEMPTS}
  FROM tests
  WHERE json_valid(payload) AND (submission IS NULL OR json_valid(submission))`;

/** What the list checks of a payload, the way toStoredTest checks all of it: older formats are skipped. */
const listedSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  title: z.string(),
  level: z.enum(LEVELS),
  grammarPoints: z.array(grammarPointSchema),
  questionCount: z.number().int(),
});

export async function listTests(): Promise<ListedTest[]> {
  // Tests not placed by a drag yet (new ones) come first, newest first; the rest follow their saved place.
  const { rows } = await (await db()).execute(`${SELECT_LISTED} ORDER BY position IS NOT NULL, position, created_at DESC`);
  return rows.map(toListedTest).filter((test): test is ListedTest => test !== null);
}

export async function getTest(id: string): Promise<StoredTest | null> {
  if (!ID.test(id)) return null;
  const { rows } = await (await db()).execute({ sql: `${SELECT_TEST} WHERE id = ?`, args: [id] });
  return rows[0] ? toStoredTest(rows[0]) : null;
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
  await write([
    { sql: "INSERT INTO tests (id, created_at, payload) VALUES (?, ?, ?)", args: [test.id, test.createdAt, JSON.stringify(payload)] },
  ]);
  return test;
}

/** Saves the list order, top first. Ids that aren't tests are dropped. */
export async function saveOrder(ids: string[]): Promise<string[]> {
  const order = [...new Set(ids)].filter((id) => ID.test(id));
  if (order.length) {
    await write(order.map((id, position) => ({ sql: "UPDATE tests SET position = ? WHERE id = ?", args: [position, id] })));
  }
  return order;
}

export async function saveSubmission(id: string, submission: Submission) {
  const { submittedAt, score, total } = submission;
  await write([
    { sql: "UPDATE tests SET submission = ? WHERE id = ?", args: [JSON.stringify(submission), id] },
    {
      sql: "INSERT OR IGNORE INTO attempts (test_id, submitted_at, score, total) SELECT id, ?, ?, ? FROM tests WHERE id = ?",
      args: [submittedAt, score, total, id],
    },
  ]);
}

/** Retake: forget the last submission and the reviewed chips. Its score stays in the attempts. False when there is no such test. */
export async function resetTest(id: string): Promise<boolean> {
  const [reset] = await write([
    { sql: "UPDATE tests SET submission = NULL WHERE id = ?", args: [id] },
    { sql: "DELETE FROM reviewed WHERE test_id = ?", args: [id] },
  ]);
  return reset.rowsAffected > 0;
}

export async function setReviewed(id: string, grammarId: string, reviewed: boolean) {
  await write([
    reviewed
      ? // Selecting from tests adds nothing when the test doesn't exist.
        { sql: "INSERT OR IGNORE INTO reviewed (test_id, grammar_id) SELECT id, ? FROM tests WHERE id = ?", args: [grammarId, id] }
      : { sql: "DELETE FROM reviewed WHERE test_id = ? AND grammar_id = ?", args: [id, grammarId] },
  ]);
  return getTest(id);
}

export async function deleteTest(id: string): Promise<boolean> {
  if (!ID.test(id)) return false;
  const [, , deleted] = await write([
    { sql: "DELETE FROM reviewed WHERE test_id = ?", args: [id] },
    { sql: "DELETE FROM attempts WHERE test_id = ?", args: [id] },
    { sql: "DELETE FROM tests WHERE id = ?", args: [id] },
  ]);
  return deleted.rowsAffected > 0;
}

export async function deleteAllTests(): Promise<number> {
  const [, , deleted] = await write(["DELETE FROM reviewed", "DELETE FROM attempts", "DELETE FROM tests"]);
  return deleted.rowsAffected;
}

/** Runs the statements as one transaction. */
async function write(statements: InStatement[]) {
  return (await db()).batch(statements, "write");
}

function toStoredTest(row: Row): StoredTest | null {
  try {
    // Rows from an older payload format (or edited by hand) are skipped, not crashed on.
    const payload = testPayloadSchema.safeParse(JSON.parse(String(row.payload)));
    if (!payload.success) return null;
    return {
      ...rowBasics(row),
      payload: payload.data,
      submission: row.submission === null ? null : (JSON.parse(String(row.submission)) as Submission),
    };
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function toListedTest(row: Row): ListedTest | null {
  const listed = listedSchema.safeParse({
    version: row.version,
    title: row.title,
    level: row.level,
    grammarPoints: row.grammar_points === null ? null : JSON.parse(String(row.grammar_points)),
    questionCount: row.question_count === null ? null : Number(row.question_count),
  });
  if (!listed.success) return null;
  const { title, level, grammarPoints, questionCount } = listed.data;
  return {
    ...rowBasics(row),
    payload: { title, level, grammarPoints },
    questionCount,
    submission: row.submission === null ? null : (JSON.parse(String(row.submission)) as ListedTest["submission"]),
  };
}

/** The columns that every read of a test has. */
function rowBasics(row: Row) {
  const reviewed = JSON.parse(String(row.reviewed)) as string[];
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    reviewed: Object.fromEntries(reviewed.map((grammarId) => [grammarId, true])),
    attempts: (JSON.parse(String(row.attempts)) as Attempt[]).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)),
  };
}
