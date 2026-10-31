import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildKanjiTestPayload, WORD_ID } from "#mocks/factories/kanji";
import { buildPayload, GRAMMAR_ID } from "#mocks/factories/payload";
import { buildSubmission } from "#mocks/factories/tests";
import { resetDatabase } from "#tests/helpers/db";
import { db } from "./db.server";
import { learnedIds, markLearned } from "./kanji.server";
import {
  createTest,
  deleteAllTests,
  deleteTest,
  getTest,
  levelStats,
  listTests,
  resetTest,
  saveOrder,
  saveSubmission,
  setReviewed,
} from "./tests.server";

const NOW = new Date("2026-10-27T09:00:00.000Z");

/** A well-formed id that no saved test has. */
const UNKNOWN_ID = "20261027-000000";

/** Saves a test at the given instant, so a test can control which one is newer. */
async function createTestAt(iso: string) {
  vi.setSystemTime(new Date(iso));
  return createTest(buildPayload({ title: iso }));
}

/** Writes a row straight to the table, the way an older app version or a hand edit can leave one. */
async function insertRawTest(id: string, payload: string) {
  await (await db()).execute({
    sql: "INSERT INTO tests (id, created_at, payload) VALUES (?, ?, ?)",
    args: [id, NOW.toISOString(), payload],
  });
}

const titlesOf = async () => (await listTests()).map((test) => test.payload.title);

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createTest", () => {
  it("saves the payload under an id made of the date and 6 random hex digits", async () => {
    const test = await createTest(buildPayload());

    expect(test).toEqual({
      id: expect.stringMatching(/^20261027-[0-9a-f]{6}$/),
      createdAt: NOW.toISOString(),
      payload: buildPayload(),
      submission: null,
      reviewed: {},
      attempts: [],
    });
    expect(await getTest(test.id)).toEqual(test);
  });
});

describe("getTest", () => {
  it("returns null for an id that no test has", async () => {
    expect(await getTest(UNKNOWN_ID)).toBeNull();
  });

  it("returns null for a value that is not an id", async () => {
    expect(await getTest("../etc/passwd")).toBeNull();
  });

  it("skips a row whose payload is not valid, instead of failing", async () => {
    await insertRawTest("20261027-aaaaaa", JSON.stringify({ version: 0 }));
    await insertRawTest("20261027-bbbbbb", "not json");

    expect(await getTest("20261027-aaaaaa")).toBeNull();
    expect(await getTest("20261027-bbbbbb")).toBeNull();
  });

  it("reads a kanji test", async () => {
    const { id } = await createTest(buildKanjiTestPayload());

    expect((await getTest(id))?.payload).toEqual(buildKanjiTestPayload());
  });
});

describe("listTests", () => {
  it("lists new tests first, newest first", async () => {
    await createTestAt("2026-10-25T00:00:00.000Z");
    await createTestAt("2026-10-27T00:00:00.000Z");
    await createTestAt("2026-10-26T00:00:00.000Z");

    expect(await titlesOf()).toEqual(["2026-10-27T00:00:00.000Z", "2026-10-26T00:00:00.000Z", "2026-10-25T00:00:00.000Z"]);
  });

  it("puts the tests in their saved order after the tests that have no place yet", async () => {
    const oldest = await createTestAt("2026-10-25T00:00:00.000Z");
    const middle = await createTestAt("2026-10-26T00:00:00.000Z");
    await createTestAt("2026-10-27T00:00:00.000Z");
    await saveOrder([oldest.id, middle.id]);

    expect(await titlesOf()).toEqual(["2026-10-27T00:00:00.000Z", "2026-10-25T00:00:00.000Z", "2026-10-26T00:00:00.000Z"]);
  });

  it("lists `limit` tests from `offset`, for a page", async () => {
    await createTestAt("2026-10-25T00:00:00.000Z");
    await createTestAt("2026-10-26T00:00:00.000Z");
    await createTestAt("2026-10-27T00:00:00.000Z");

    expect((await listTests({ limit: 1, offset: 1 })).map((test) => test.payload.title)).toEqual(["2026-10-26T00:00:00.000Z"]);
  });

  it("reads only what the list shows: the question count, and no questions or answers", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission({ answers: { q1: 2 }, score: 1, wrongGrammarIds: [GRAMMAR_ID] }));
    await setReviewed(id, GRAMMAR_ID, true);

    const [listed] = await listTests();

    expect(listed).toEqual({
      id,
      createdAt: NOW.toISOString(),
      payload: { title: buildPayload().title, level: "N2", grammarPoints: buildPayload().grammarPoints },
      questionCount: 3,
      submission: { submittedAt: buildSubmission().submittedAt, score: 1, total: 3, wrongGrammarIds: [GRAMMAR_ID] },
      reviewed: { [GRAMMAR_ID]: true },
      attempts: [{ submittedAt: buildSubmission().submittedAt, score: 1, total: 3 }],
    });
  });

  it("skips a row whose payload is not valid, and lists the others", async () => {
    await createTest(buildPayload());
    await insertRawTest("20261027-aaaaaa", "not json");

    expect(await listTests()).toHaveLength(1);
  });

  it("skips a row from an older payload format", async () => {
    await createTest(buildPayload());
    await insertRawTest("20261027-aaaaaa", JSON.stringify({ ...buildPayload(), version: 0 }));
    await insertRawTest("20261027-bbbbbb", JSON.stringify({ ...buildPayload(), sections: [] }));

    expect(await listTests()).toHaveLength(1);
  });

  it("leaves out kanji tests, which the kanji page lists by chapter, and keeps them out of the level's figures", async () => {
    await createTest(buildPayload());
    const kanji = await createTest(buildKanjiTestPayload());
    await saveSubmission(kanji.id, buildSubmission({ score: 0, total: 2 }));

    expect(await listTests()).toHaveLength(1);
    expect(await levelStats("N2")).toEqual({ total: 1, taken: 0, average: null, toReview: 0 });
  });
});

describe("saveOrder", () => {
  it("returns the order it saved, without repeats and without values that are not ids", async () => {
    const first = await createTest(buildPayload());
    const second = await createTest(buildPayload());

    expect(await saveOrder([second.id, second.id, "not-an-id", first.id])).toEqual([second.id, first.id]);
  });

  it("orders a page's tests among the places they hold, so the tests on other pages keep theirs", async () => {
    const a = await createTestAt("2026-10-25T00:00:00.000Z");
    const b = await createTestAt("2026-10-26T00:00:00.000Z");
    const c = await createTestAt("2026-10-27T00:00:00.000Z");
    const d = await createTestAt("2026-10-28T00:00:00.000Z");
    await saveOrder([a.id, b.id, c.id, d.id]);

    await saveOrder([c.id, b.id]);

    expect(await titlesOf()).toEqual([a, c, b, d].map((test) => test.payload.title));
  });

  it("saves nothing for an empty order", async () => {
    expect(await saveOrder([])).toEqual([]);
  });
});

describe("saveSubmission", () => {
  it("saves the submission", async () => {
    const { id } = await createTest(buildPayload());
    const submission = buildSubmission({ answers: { q1: 2 }, score: 1 });

    await saveSubmission(id, submission);

    expect((await getTest(id))?.submission).toEqual(submission);
  });

  it("keeps the score of every submission as an attempt, oldest first", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission({ submittedAt: "2026-10-28T09:00:00.000Z", score: 2 }));
    await saveSubmission(id, buildSubmission({ submittedAt: "2026-10-27T09:00:00.000Z", score: 1 }));

    expect((await getTest(id))?.attempts).toEqual([
      { submittedAt: "2026-10-27T09:00:00.000Z", score: 1, total: 3 },
      { submittedAt: "2026-10-28T09:00:00.000Z", score: 2, total: 3 },
    ]);
  });

  it("forgets the learned marks of the words to unlearn, and keeps the others", async () => {
    const { id } = await createTest(buildKanjiTestPayload());
    await markLearned(WORD_ID);
    await markLearned("n2-c1-招く");

    await saveSubmission(id, buildSubmission({ wrongGrammarIds: [WORD_ID] }), [WORD_ID]);

    expect(await learnedIds()).toEqual(new Set(["n2-c1-招く"]));
  });
});

describe("setReviewed", () => {
  it("marks a review chip as reviewed, and clears the mark", async () => {
    const { id } = await createTest(buildPayload());

    expect((await setReviewed(id, GRAMMAR_ID, true))?.reviewed).toEqual({ [GRAMMAR_ID]: true });
    expect((await setReviewed(id, GRAMMAR_ID, false))?.reviewed).toEqual({});
  });

  it("keeps one mark when the chip is marked twice", async () => {
    const { id } = await createTest(buildPayload());
    await setReviewed(id, GRAMMAR_ID, true);

    expect((await setReviewed(id, GRAMMAR_ID, true))?.reviewed).toEqual({ [GRAMMAR_ID]: true });
  });

  it("adds no mark for a test that does not exist", async () => {
    expect(await setReviewed(UNKNOWN_ID, GRAMMAR_ID, true)).toBeNull();

    const { rows } = await (await db()).execute("SELECT * FROM reviewed");
    expect(rows).toHaveLength(0);
  });
});

describe("resetTest", () => {
  it("clears the submission and the review marks, keeps the test, and returns true", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission());
    await setReviewed(id, GRAMMAR_ID, true);

    expect(await resetTest(id)).toBe(true);
    expect(await getTest(id)).toMatchObject({ id, submission: null, reviewed: {} });
  });

  it("keeps the attempts, so the earlier scores stay", async () => {
    const { id } = await createTest(buildPayload());
    await saveSubmission(id, buildSubmission({ score: 1 }));
    await resetTest(id);

    expect((await getTest(id))?.attempts).toEqual([{ submittedAt: buildSubmission().submittedAt, score: 1, total: 3 }]);
  });

  it("returns false for an id that no test has", async () => {
    expect(await resetTest(UNKNOWN_ID)).toBe(false);
  });
});

describe("deleteTest", () => {
  it("deletes the test, its review marks and its attempts, and returns true", async () => {
    const { id } = await createTest(buildPayload());
    await setReviewed(id, GRAMMAR_ID, true);
    await saveSubmission(id, buildSubmission());

    expect(await deleteTest(id)).toBe(true);
    expect(await getTest(id)).toBeNull();
    expect((await (await db()).execute("SELECT * FROM attempts")).rows).toHaveLength(0);
  });

  it("returns false for an id that no test has", async () => {
    expect(await deleteTest(UNKNOWN_ID)).toBe(false);
  });

  it("returns false for a value that is not an id", async () => {
    expect(await deleteTest("not-an-id")).toBe(false);
  });
});

describe("deleteAllTests", () => {
  it("deletes every test and returns how many it deleted", async () => {
    const { id } = await createTest(buildPayload());
    await createTest(buildPayload());
    await setReviewed(id, GRAMMAR_ID, true);
    await saveSubmission(id, buildSubmission());

    expect(await deleteAllTests()).toBe(2);
    expect(await listTests()).toEqual([]);
  });
});
