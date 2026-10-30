import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildFillBlankQuestion,
  buildFillBlankSection,
  buildPassage,
  buildPassageSection,
  buildPayload,
  buildSentenceOrderSection,
  GRAMMAR_ID,
} from "#mocks/factories/payload";
import { buildListedTest, buildStoredTest, buildSubmission } from "#mocks/factories/tests";
import {
  gradeTest,
  questionCount,
  submittedAnswersSchema,
  toQuizView,
  toResultsView,
  toSubmission,
  toSummary,
} from "./grading.server";
import type { Answers, ResultQuestion } from "./views";

/** The right answer to each question of `buildPayload()`. q2 puts piece 2 (かいが) in the ★ slot 3. */
const ALL_RIGHT: Answers = { q1: 2, q2: [1, 0, 2, 3], q3: 0 };

const NOW = new Date("2026-10-27T09:30:00.000Z");

const PAYLOAD = buildPayload();

/** One graded question, found by its id across every section and group. */
function questionOf(answers: Answers, id: string): ResultQuestion {
  const questions = gradeTest(PAYLOAD, answers).sections.flatMap((s) => s.groups.flatMap((g) => g.questions));
  const question = questions.find((q) => q.id === id);
  if (!question) throw new Error(`no graded question ${id}`);
  return question;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("submittedAnswersSchema", () => {
  it("accepts a choice index, the 4 slots of a sentence-order answer, and no answer", () => {
    expect(submittedAnswersSchema.safeParse({ q1: 3, q2: [1, null, 2, null], q3: null }).success).toBe(true);
  });

  it("rejects a choice that is not 0 to 3", () => {
    expect(submittedAnswersSchema.safeParse({ q1: 4 }).success).toBe(false);
    expect(submittedAnswersSchema.safeParse({ q1: -1 }).success).toBe(false);
    expect(submittedAnswersSchema.safeParse({ q1: 1.5 }).success).toBe(false);
  });

  it("rejects slots that are not exactly 4", () => {
    expect(submittedAnswersSchema.safeParse({ q2: [1, 0, 2] }).success).toBe(false);
  });

  it("rejects a value of another type", () => {
    expect(submittedAnswersSchema.safeParse({ q1: "2" }).success).toBe(false);
  });
});

describe("questionCount", () => {
  it("counts the questions of every section", () => {
    expect(questionCount(PAYLOAD)).toBe(3);
  });

  it("counts the questions of every passage", () => {
    const passages = buildPassageSection({ passages: [buildPassage(), buildPassage()] });

    expect(questionCount(buildPayload({ sections: [PAYLOAD.sections[0], PAYLOAD.sections[1], passages] }))).toBe(4);
  });
});

describe("toQuizView", () => {
  it("numbers the questions in section order", () => {
    const view = toQuizView(buildStoredTest());

    expect(view).toMatchObject({ id: "20261027-abc123", title: "第1週 1日目", level: "N2", questionCount: 3 });
    expect(view.sections.map((s) => [s.type, s.groups.flatMap((g) => g.questions.map((q) => q.num))])).toEqual([
      ["fill-blank", [1]],
      ["sentence-order", [2]],
      ["passage", [3]],
    ]);
  });

  it("leaves out the answers and the grammar ids, so the browser cannot read them", () => {
    const json = JSON.stringify(toQuizView(buildStoredTest()));

    expect(json).not.toContain("answerIndex");
    expect(json).not.toContain("correctOrder");
    expect(json).not.toContain("grammarId");
  });

  it("links each blank of a passage to its question", () => {
    const [passage] = toQuizView(buildStoredTest()).sections[2].groups;

    expect(passage.segments).toEqual([
      { kind: "text", text: "毎日練習した" },
      { kind: "blank", num: 3, questionId: "q3" },
      { kind: "text", text: "、合格できた。" },
    ]);
  });
});

describe("gradeTest", () => {
  it("scores a sheet with every answer right", () => {
    const graded = gradeTest(PAYLOAD, ALL_RIGHT);

    expect(graded).toMatchObject({ score: 3, total: 3, wrongGrammarIds: [] });
    expect(graded.sections.map((s) => [s.correct, s.total])).toEqual([
      [1, 1],
      [1, 1],
      [1, 1],
    ]);
  });

  it("grades each question alone, so one wrong answer does not change the others", () => {
    expect(gradeTest(PAYLOAD, { ...ALL_RIGHT, q1: 0 })).toMatchObject({ score: 2, total: 3 });
  });

  it("grades a sentence-order answer on the ★ slot only", () => {
    expect(questionOf({ q2: [3, null, 2, null] }, "q2").correct).toBe(true);
    expect(questionOf({ q2: [2, 0, 1, 3] }, "q2").correct).toBe(false);
  });

  it("lists each wrong grammar point once", () => {
    expect(gradeTest(PAYLOAD, {})).toMatchObject({ score: 0, wrongGrammarIds: [GRAMMAR_ID] });
  });

  it("writes the learner's answer and the right one as number and text", () => {
    expect(questionOf({ q1: 0 }, "q1")).toMatchObject({ correct: false, yours: "1 かいもなく", answer: "3 かいがあって" });
    expect(questionOf({ q2: [null, null, 0, null] }, "q2")).toMatchObject({ yours: "1 練習した", answer: "3 かいが" });
  });

  it("carries a question's explanation into its result, and null for a question without one", () => {
    const explained = buildFillBlankQuestion({ explanation: "かいがあって needs a result that is good." });
    const payload = buildPayload({ sections: [buildFillBlankSection({ questions: [explained] }), buildSentenceOrderSection(), buildPassageSection()] });

    const [q1, q2] = gradeTest(payload, {}).sections.flatMap((s) => s.groups.flatMap((g) => g.questions));

    expect([q1.explanation, q2.explanation]).toEqual(["かいがあって needs a result that is good.", null]);
  });

  it("gives no learner's answer for a question left blank", () => {
    expect(questionOf({}, "q1")).toMatchObject({ correct: false, yours: null });
    expect(questionOf({ q2: [1, 0, null, 3] }, "q2")).toMatchObject({ correct: false, yours: null });
  });

  it("counts an answer of the wrong kind as wrong", () => {
    expect(questionOf({ q1: [2, 2, 2, 2] }, "q1").correct).toBe(false);
    expect(questionOf({ q2: 2 }, "q2").correct).toBe(false);
  });

  it("shows a fill-blank prompt with the right word in the blank", () => {
    expect(questionOf(ALL_RIGHT, "q1").prompt).toEqual({ before: "練習した", after: "、合格できた。", fill: "かいがあって" });
  });

  it("shows a sentence-order question as the full sentence, with the ★ piece marked", () => {
    expect(questionOf(ALL_RIGHT, "q2").sentence).toEqual({
      before: "彼は",
      after: "合格した。",
      pieces: [
        { text: "毎日", star: false },
        { text: "練習した", star: false },
        { text: "かいが", star: true },
        { text: "あって", star: false },
      ],
    });
  });

  it("fills each passage blank and marks it right or wrong", () => {
    const blankOf = (answers: Answers) => gradeTest(PAYLOAD, answers).sections[2].groups[0].segments?.[1];

    expect(blankOf(ALL_RIGHT)).toEqual({ kind: "blank", num: 3, fill: "かいがあって", correct: true });
    expect(blankOf({ q3: 1 })).toEqual({ kind: "blank", num: 3, fill: "かいがあって", correct: false });
  });
});

describe("toSubmission", () => {
  it("keeps the answers to the questions of the test, grades them, and stamps the time", () => {
    expect(toSubmission(PAYLOAD, ALL_RIGHT)).toEqual({
      submittedAt: NOW.toISOString(),
      answers: ALL_RIGHT,
      score: 3,
      total: 3,
      wrongGrammarIds: [],
    });
  });

  it("drops answers to question ids that the test does not have", () => {
    const submitted: Answers = { ...ALL_RIGHT, q0: 1, q4: 1, q01: 1, notes: 1 };

    expect(toSubmission(PAYLOAD, submitted).answers).toEqual(ALL_RIGHT);
  });
});

const EARLIER = { submittedAt: "2026-10-27T09:30:00.000Z", score: 1, total: 3 };
const LATER = { submittedAt: "2026-10-28T09:30:00.000Z", score: 2, total: 3 };

describe("toResultsView", () => {
  it("adds the title, the level and a rounded percent to the grades", () => {
    const view = toResultsView(buildStoredTest(), buildSubmission({ answers: { q1: 2, q2: [1, 0, 2, 3] } }));

    expect(view).toMatchObject({ id: "20261027-abc123", title: "第1週 1日目", level: "N2", score: 2, total: 3, percent: 67 });
  });

  it("grades the saved answers again, so the view does not trust the saved score", () => {
    expect(toResultsView(buildStoredTest(), buildSubmission({ answers: ALL_RIGHT, score: 0 })).score).toBe(3);
  });

  it("gives a review chip for each wrong grammar point, with its reviewed mark", () => {
    const test = buildStoredTest({ reviewed: { [GRAMMAR_ID]: true } });

    expect(toResultsView(test, buildSubmission()).review).toEqual([
      { grammarId: GRAMMAR_ID, pattern: "〜かいがある", level: "N2", week: 1, day: 1, number: 1, reviewed: true },
    ]);
  });

  it("gives the score of the attempt before this one, or none on the first", () => {
    const test = buildStoredTest({ attempts: [EARLIER, LATER] });

    expect(toResultsView(test, buildSubmission({ submittedAt: LATER.submittedAt })).previous).toEqual({ score: 1, total: 3 });
    expect(toResultsView(test, buildSubmission({ submittedAt: EARLIER.submittedAt })).previous).toBeNull();
  });
});

describe("toSummary", () => {
  it("sums up a test that is not taken yet", () => {
    expect(toSummary(buildListedTest())).toEqual({
      id: "20261027-abc123",
      title: "第1週 1日目",
      level: "N2",
      questionCount: 3,
      result: null,
      review: [],
      previous: null,
    });
  });

  it("gives the last score as a percent, and the chips to review", () => {
    const test = buildListedTest({ submission: buildSubmission({ score: 1, total: 3, wrongGrammarIds: [GRAMMAR_ID] }) });

    expect(toSummary(test)).toMatchObject({
      result: { score: 1, total: 3, percent: 33 },
      review: [{ grammarId: GRAMMAR_ID, reviewed: false }],
    });
  });

  it("leaves out a chip for a grammar point that the payload does not have", () => {
    const test = buildListedTest({ submission: buildSubmission({ wrongGrammarIds: ["n2-w9-d6-g4"] }) });

    expect(toSummary(test).review).toEqual([]);
  });

  it("gives the score of the attempt before the last result", () => {
    const test = buildListedTest({ submission: buildSubmission({ submittedAt: LATER.submittedAt }), attempts: [EARLIER, LATER] });

    expect(toSummary(test).previous).toEqual({ score: 1, total: 3 });
  });

  it("gives the last score while a retake is under way", () => {
    expect(toSummary(buildListedTest({ attempts: [EARLIER, LATER] })).previous).toEqual({ score: 2, total: 3 });
  });
});
