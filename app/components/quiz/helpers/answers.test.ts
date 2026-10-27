import { describe, expect, it } from "vitest";
import { buildQuizView } from "#mocks/factories/views";
import type { QuizQuestion } from "~/lib/views";
import { isAnswered, quizProgress } from "./answers";

const QUIZ = buildQuizView();

/** A question of the quiz by id: q1 fill-blank, q2 sentence-order, q3 passage. */
function questionOf(id: string): QuizQuestion {
  const question = QUIZ.sections.flatMap((s) => s.groups.flatMap((g) => g.questions)).find((q) => q.id === id);
  if (!question) throw new Error(`no question ${id}`);
  return question;
}

describe("isAnswered", () => {
  it("counts a choice question once a choice is picked", () => {
    expect(isAnswered(questionOf("q1"), { q1: 0 })).toBe(true);
    expect(isAnswered(questionOf("q3"), { q3: 3 })).toBe(true);
  });

  it("counts a sentence-order question only once all 4 slots are filled", () => {
    expect(isAnswered(questionOf("q2"), { q2: [1, 0, 2, 3] })).toBe(true);
    expect(isAnswered(questionOf("q2"), { q2: [1, 0, null, 3] })).toBe(false);
  });

  it("does not count a question with no answer, or an answer of the wrong kind", () => {
    expect(isAnswered(questionOf("q1"), {})).toBe(false);
    expect(isAnswered(questionOf("q1"), { q1: null })).toBe(false);
    expect(isAnswered(questionOf("q2"), { q2: 2 })).toBe(false);
  });
});

describe("quizProgress", () => {
  it("counts the answered questions, what is left, and the percent done", () => {
    const progress = quizProgress(QUIZ, { q1: 2, q2: [1, 0, null, 3] });

    expect(progress).toEqual({ answeredIds: new Set(["q1"]), answered: 1, left: 2, percent: 33 });
  });

  it("is 100 percent with nothing left once every question is answered", () => {
    expect(quizProgress(QUIZ, { q1: 2, q2: [1, 0, 2, 3], q3: 0 })).toMatchObject({ answered: 3, left: 0, percent: 100 });
  });
});
