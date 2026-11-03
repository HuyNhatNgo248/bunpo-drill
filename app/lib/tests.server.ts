import { randomBytes } from "node:crypto";
import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { orm, write } from "./db.server";
import {
  grammarPointSchema,
  LEVELS,
  PAYLOAD_VERSION,
  type Level,
  type TestPayload,
} from "./payload";
import { attempts, learnedWords, progress, reviewed, tests } from "./schema.server";
import { readPayload, type AnyPayload } from "./test-kinds";
import type { Answers } from "./views";

/**
 * Storage in the database from db.server.ts: a `tests` row per test holding its payload, which every user shares.
 * What a user did with it is theirs alone: a `progress` row with their last submission and the draft of the next one,
 * a `reviewed` row per review chip they marked reviewed, and an `attempts` row per submission.
 * Kanji tests are saved here too; the home list, its figures and GET /api/tests show only the grammar ones.
 */

export type Submission = {
  submittedAt: string;
  answers: Answers;
  score: number;
  total: number;
  /** The grammar points answered wrong; on a kanji test, the words (kept under this name so saved results still read). */
  wrongGrammarIds: string[];
};

/** The answers and checked parts of a test not submitted yet, saved as they change so the test goes on anywhere. */
export type Draft = {
  answers: Answers;
  checked: number[];
  /** A retake of the wrong answers: the questions answered right last time, kept and not shown. */
  kept?: string[];
};

/** The score of one submission. A retake clears the submission but keeps its attempt. */
export type Attempt = { submittedAt: string; score: number; total: number };

export type StoredTest = {
  id: string;
  createdAt: string;
  payload: AnyPayload;
  submission: Submission | null;
  draft: Draft | null;
  reviewed: Record<string, boolean>;
  /** Oldest first. */
  attempts: Attempt[];
};

/** A test as the list shows it: no questions and no answers, which are most of a test's size. */
export type ListedTest = Omit<StoredTest, "payload" | "submission" | "draft"> & {
  payload: Pick<TestPayload, "title" | "level" | "grammarPoints">;
  questionCount: number;
  submission: Omit<Submission, "answers"> | null;
  /** How many questions its draft answers; null when it has no draft, so it is not started. */
  answered: number | null;
};

const ID = /^[0-9]{8}-[0-9a-f]{6}$/;

/** Joins each test to `userId`'s progress on it, when they have some. */
const progressOf = (userId: number) => and(eq(progress.testId, tests.id), eq(progress.userId, userId));

/** A test's chips that `userId` marked and their attempts, as JSON arrays, read in the same query as the test. */
const related = (userId: number) => ({
  reviewed: sql<string>`(SELECT json_group_array(${reviewed.grammarId}) FROM ${reviewed}
    WHERE ${reviewed.testId} = ${tests.id} AND ${reviewed.userId} = ${userId})`,
  attempts: sql<string>`(SELECT json_group_array(json_object('submittedAt', ${attempts.submittedAt}, 'score', ${attempts.score}, 'total', ${attempts.total}))
    FROM ${attempts} WHERE ${attempts.testId} = ${tests.id} AND ${attempts.userId} = ${userId})`,
});

// The list reads each payload in SQL down to what it shows, so the questions never leave the database.
const listed = (userId: number) => ({
  id: tests.id,
  createdAt: tests.createdAt,
  version: sql<unknown>`${tests.payload} ->> '$.version'`,
  title: sql<unknown>`${tests.payload} ->> '$.title'`,
  level: sql<unknown>`${tests.payload} ->> '$.level'`,
  grammarPoints: sql<string | null>`${tests.payload} -> '$.grammarPoints'`,
  questionCount: sql<
    number | null
  >`json_array_length(${tests.payload}, '$.sections[0].questions')
    + json_array_length(${tests.payload}, '$.sections[1].questions')
    + (SELECT ifnull(sum(json_array_length(value, '$.questions')), 0) FROM json_each(${tests.payload}, '$.sections[2].passages'))`,
  // A submission that can't be read shows as not taken.
  submission: sql<string | null>`json_remove(${json(progress.submission)}, '$.answers')`,
  draft: progress.draft,
  ...related(userId),
});

/** What the list checks of a payload, the way toStoredTest checks all of it: older formats are skipped. */
const listedSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  title: z.string(),
  level: z.enum(LEVELS),
  grammarPoints: z.array(grammarPointSchema),
  questionCount: z.number().int(),
});

/** A column's JSON, or NULL when it is not JSON: ->> and json_each on a broken row would fail the whole query. */
function json(column: typeof tests.payload | typeof progress.submission) {
  return sql`(CASE WHEN json_valid(${column}) THEN ${column} END)`;
}

/** The rows the list can show: grammar tests in the current payload format, and of `level` when there is one. */
const listable = (level?: Level) =>
  and(
    sql`${json(tests.payload)} ->> '$.version' = ${PAYLOAD_VERSION}`,
    // Only a kanji test has a kind; the kanji page lists those by chapter (kanji.server.ts).
    sql`${json(tests.payload)} ->> '$.kind' IS NULL`,
    level && sql`${json(tests.payload)} ->> '$.level' = ${level}`,
  );

/** Compares titles with their numbers as numbers: 第2週 before 第10週, 1〜3日目 before 3〜6日目. */
const titleOrder = new Intl.Collator("ja", { numeric: true });

/**
 * The tests with `userId`'s progress, in the list's order: the ones in progress, then the ones not started, then the taken ones, each by title
 * (`latestFirst`: the title order reversed, so the latest week comes first); tests with the same title oldest first.
 * Every one, or one level's.
 * shortcut: sorts all of a level's tests in memory, as SQLite can't compare the numbers in a title; move the order
 * into SQL (a week and day column) if a level ever holds thousands of tests.
 */
export async function listTests(
  userId: number,
  { level, latestFirst = false }: { level?: Level; latestFirst?: boolean } = {},
): Promise<ListedTest[]> {
  const rows = await (await orm())
    .select(listed(userId))
    .from(tests)
    .leftJoin(progress, progressOf(userId))
    .where(listable(level))
    .orderBy(tests.createdAt, tests.id);
  return rows
    .map(toListedTest)
    .filter((test): test is ListedTest => test !== null)
    .sort(
      (a, b) =>
        stageOf(a) - stageOf(b) ||
        titleOrder.compare(a.payload.title, b.payload.title) * (latestFirst ? -1 : 1),
    );
}

/** Where a test is: 0 in progress, 1 not started, 2 taken. */
const stageOf = (test: ListedTest) => (test.submission ? 2 : test.answered !== null ? 0 : 1);

/** `userId`'s figures over all of a level's tests: how many, how many taken, their average, and the patterns to review. */
export async function levelStats(level: Level, userId: number) {
  const db = await orm();
  const submission = json(progress.submission);
  const score = sql`${submission} ->> '$.score'`;
  const total = sql`${submission} ->> '$.total'`;
  const [[counts], [review]] = await Promise.all([
    db
      .select({
        total: count(),
        taken: count(submission),
        // Each score as a whole percent first, as its row shows it; then their average.
        average: sql<
          number | null
        >`avg(CASE WHEN ${total} = 0 THEN 0 ELSE round(100.0 * ${score} / ${total}) END)`,
      })
      .from(tests)
      .leftJoin(progress, progressOf(userId))
      .where(listable(level)),
    // A pattern counts once however many tests got it wrong, and not at all where its chip is marked reviewed.
    db
      .select({
        toReview: sql<number>`count(DISTINCT point.value ->> '$.pattern')`,
      })
      .from(
        sql`${tests} JOIN ${progress} ON ${progressOf(userId)}, json_each(${submission}, '$.wrongGrammarIds') AS wrong, json_each(${json(tests.payload)}, '$.grammarPoints') AS point`,
      )
      .where(
        and(
          listable(level),
          sql`point.value ->> '$.id' = wrong.value`,
          sql`NOT EXISTS (SELECT 1 FROM ${reviewed}
            WHERE ${reviewed.userId} = ${userId} AND ${reviewed.testId} = ${tests.id} AND ${reviewed.grammarId} = wrong.value)`,
        ),
      ),
  ]);
  const { average, ...rest } = counts!;
  return {
    ...rest,
    average: average === null ? null : Math.round(average),
    toReview: review!.toReview,
  };
}

/** The level of the newest test the list can show, or null before there is one. */
export async function newestLevel(): Promise<Level | null> {
  const [newest] = await (
    await orm()
  )
    .select({ level: sql<string>`${tests.payload} ->> '$.level'` })
    .from(tests)
    .where(listable())
    .orderBy(desc(tests.createdAt))
    .limit(1);
  return LEVELS.find((level) => level === newest?.level) ?? null;
}

/** A test with `userId`'s progress on it. */
export async function getTest(id: string, userId: number): Promise<StoredTest | null> {
  if (!ID.test(id)) return null;
  const [row] = await (
    await orm()
  )
    .select({
      id: tests.id,
      createdAt: tests.createdAt,
      payload: tests.payload,
      submission: progress.submission,
      draft: progress.draft,
      ...related(userId),
    })
    .from(tests)
    .leftJoin(progress, progressOf(userId))
    .where(eq(tests.id, id));
  return row ? toStoredTest(row) : null;
}

export async function createTest(payload: AnyPayload): Promise<StoredTest> {
  const now = new Date();
  const test: StoredTest = {
    id: `${now.toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex")}`,
    createdAt: now.toISOString(),
    payload,
    submission: null,
    draft: null,
    reviewed: {},
    attempts: [],
  };
  await (await orm())
    .insert(tests)
    .values({
      id: test.id,
      createdAt: test.createdAt,
      payload: JSON.stringify(payload),
      title: payload.title,
    });
  return test;
}

/**
 * Saves `userId`'s result and its attempt, and drops their draft. `unlearn`: the words a kanji test got wrong, whose
 * learned marks go with it.
 */
export async function saveSubmission(
  userId: number,
  id: string,
  submission: Submission,
  unlearn: string[] = [],
) {
  const { submittedAt, score, total } = submission;
  const text = JSON.stringify(submission);
  const db = await orm();
  const user = sql<number>`${userId}`.as("user_id");
  await write([
    db.delete(learnedWords).where(and(eq(learnedWords.userId, userId), inArray(learnedWords.wordId, unlearn))),
    // Selecting from tests saves nothing for a test that is gone.
    db
      .insert(progress)
      .select(
        db
          .select({
            userId: user,
            testId: tests.id,
            submission: sql<string>`${text}`.as("submission"),
            draft: sql<null>`NULL`.as("draft"),
          })
          .from(tests)
          .where(eq(tests.id, id)),
      )
      .onConflictDoUpdate({ target: [progress.userId, progress.testId], set: { submission: text, draft: null } }),
    // The same submission twice adds one attempt.
    db
      .insert(attempts)
      .select(
        db
          .select({
            userId: user,
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

/**
 * Saves `userId`'s draft of a test they have not submitted yet; one with no answer and no checked part is dropped. A
 * test that is submitted keeps none, so a save that arrives after the submit changes nothing.
 */
export async function saveDraft(userId: number, id: string, draft: Draft): Promise<void> {
  const answered = Object.values(draft.answers).some((answer) => (Array.isArray(answer) ? answer.some((slot) => slot !== null) : answer !== null));
  const text = answered || draft.checked.length ? JSON.stringify(draft) : null;
  const db = await orm();
  // Selecting from tests saves nothing for a test that is gone.
  await db
    .insert(progress)
    .select(
      db
        .select({
          userId: sql<number>`${userId}`.as("user_id"),
          testId: tests.id,
          submission: sql<null>`NULL`.as("submission"),
          draft: sql<string | null>`${text}`.as("draft"),
        })
        .from(tests)
        .where(eq(tests.id, id)),
    )
    .onConflictDoUpdate({ target: [progress.userId, progress.testId], set: { draft: text }, setWhere: isNull(progress.submission) });
}

/**
 * Retake: forget `userId`'s last submission and reviewed chips. Its score stays in the attempts. False when there is
 * no such test.
 */
export async function resetTest(userId: number, id: string): Promise<boolean> {
  const db = await orm();
  const [, , found] = await write([
    db.delete(progress).where(and(eq(progress.userId, userId), eq(progress.testId, id))),
    db.delete(reviewed).where(and(eq(reviewed.userId, userId), eq(reviewed.testId, id))),
    db.select({ id: tests.id }).from(tests).where(eq(tests.id, id)),
  ]);
  return found.length > 0;
}

/** Marks or clears `userId`'s review chip, and returns the test as they see it. */
export async function setReviewed(
  userId: number,
  id: string,
  grammarId: string,
  marked: boolean,
) {
  const db = await orm();
  await (marked
    ? // Selecting from tests adds nothing when the test doesn't exist; marking twice keeps one mark.
      db
        .insert(reviewed)
        .select(
          db
            .select({
              userId: sql<number>`${userId}`.as("user_id"),
              testId: tests.id,
              grammarId: sql<string>`${grammarId}`.as("grammar_id"),
            })
            .from(tests)
            .where(eq(tests.id, id)),
        )
        .onConflictDoNothing()
    : db
        .delete(reviewed)
        .where(
          and(eq(reviewed.userId, userId), eq(reviewed.testId, id), eq(reviewed.grammarId, grammarId)),
        ));
  return getTest(id, userId);
}

/** The JSON of a test's marked chips and attempts, as `related` reads them. */
type Related = { reviewed: string; attempts: string };

function toStoredTest(
  row: {
    id: string;
    createdAt: string;
    payload: string;
    submission: string | null;
    draft: string | null;
  } & Related,
): StoredTest | null {
  try {
    // Rows from an older payload format (or edited by hand) are skipped, not crashed on.
    const payload = readPayload(JSON.parse(row.payload));
    if (!payload) return null;
    return {
      ...rowBasics(row),
      payload,
      submission:
        row.submission === null
          ? null
          : (JSON.parse(row.submission) as Submission),
      draft: readDraft(row.draft),
    };
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function toListedTest(
  row: {
    id: string;
    createdAt: string;
    version: unknown;
    title: unknown;
    level: unknown;
    grammarPoints: string | null;
  } & {
    questionCount: number | null;
    submission: string | null;
    draft: string | null;
  } & Related,
): ListedTest | null {
  const parsed = listedSchema.safeParse({
    version: row.version,
    title: row.title,
    level: row.level,
    grammarPoints:
      row.grammarPoints === null ? null : JSON.parse(row.grammarPoints),
    questionCount:
      row.questionCount === null ? null : Number(row.questionCount),
  });
  if (!parsed.success) return null;
  const { title, level, grammarPoints, questionCount } = parsed.data;
  const draft = readDraft(row.draft);
  return {
    ...rowBasics(row),
    payload: { title, level, grammarPoints },
    questionCount,
    submission:
      row.submission === null
        ? null
        : (JSON.parse(row.submission) as ListedTest["submission"]),
    answered: draft && answeredCount(draft.answers),
  };
}

/** A saved draft, or null for none and for one that can't be read: a broken draft must not hide its test. */
function readDraft(text: string | null): Draft | null {
  if (text === null) return null;
  try {
    const draft = JSON.parse(text) as Draft | null;
    return typeof draft?.answers === "object" && draft.answers !== null && Array.isArray(draft.checked) ? draft : null;
  } catch {
    return null;
  }
}

/** The questions a sheet answers: a picked choice, or a sentence order with all 4 slots filled. */
const answeredCount = (answers: Answers) =>
  Object.values(answers).filter((answer) => (Array.isArray(answer) ? answer.every((slot) => slot !== null) : answer !== null)).length;

/** The columns that every read of a test has. */
function rowBasics(row: { id: string; createdAt: string } & Related) {
  const marked = JSON.parse(row.reviewed) as string[];
  return {
    id: row.id,
    createdAt: row.createdAt,
    reviewed: Object.fromEntries(marked.map((grammarId) => [grammarId, true])),
    attempts: (JSON.parse(row.attempts) as Attempt[]).sort((a, b) =>
      a.submittedAt.localeCompare(b.submittedAt),
    ),
  };
}
